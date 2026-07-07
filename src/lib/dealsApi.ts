import { supabase } from './supabaseClient';

// Deal Manager persistence layer — replaces the Artifacts-only `window.storage`
// KV API with real per-user, RLS-scoped Postgres tables + Storage.
//
// The frontend still works with one big in-memory array of "property" objects
// per view (matching the original artifact's shape) and calls
// fetchProperties()/persistProperties() on load/save, same as it called
// window.storage.get()/set() before. persistProperties() bulk-upserts the
// current array and deletes any row that's no longer present — a full-array
// sync rather than granular row mutations, chosen to keep the ~10k-line UI
// component largely untouched. Saves are debounced by the caller.

const DOCUMENTS_BUCKET = 'deal-documents';

// ---------------------------------------------------------------
// Properties (deals)
// ---------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProperty(row: any) {
  return {
    id: row.id,
    status: row.status,
    ampel: row.ampel ?? null,
    dealCaptain: row.deal_captain ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    fileName: row.file_name ?? undefined,
    uploadedAt: row.uploaded_at,
    data: row.data ?? {},
    feeModel: row.fee_model ?? undefined,
    // internal only — not rendered; needed so an admin's bulk save doesn't
    // reassign ownership of deals that belong to other users
    _ownerId: row.user_id as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function propertyToRow(property: any, currentUserId: string) {
  return {
    id: property.id,
    user_id: property._ownerId || currentUserId,
    status: property.status,
    ampel: property.ampel ?? null,
    deal_captain: property.dealCaptain ?? null,
    rejection_reason: property.rejectionReason ?? null,
    file_name: property.fileName ?? null,
    uploaded_at: property.uploadedAt || new Date().toISOString(),
    data: property.data ?? {},
    fee_model: property.feeModel ?? null,
  };
}

export async function fetchProperties(userId: string, viewAll: boolean) {
  let query = supabase.from('properties').select('*').order('uploaded_at', { ascending: false });
  if (!viewAll) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToProperty);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function persistProperties(properties: any[], userId: string, knownIds: Iterable<string>) {
  const rows = properties.map((p) => propertyToRow(p, userId));
  if (rows.length) {
    const { error } = await supabase.from('properties').upsert(rows);
    if (error) throw error;
  }

  // Delete only rows that were part of THIS client's last-loaded snapshot and
  // are now missing locally (an explicit removal). We deliberately don't
  // re-query "what exists on the server right now" — in a shared workspace
  // another user may have added rows this client hasn't fetched yet, and
  // diffing against live server state would delete those out from under them.
  const currentIds = new Set(properties.map((p) => p.id));
  const toDelete = [...knownIds].filter((id) => !currentIds.has(id));
  if (toDelete.length) {
    const { error: deleteError } = await supabase.from('properties').delete().in('id', toDelete);
    if (deleteError) throw deleteError;
  }
}

// ---------------------------------------------------------------
// Manual persons (contacts)
// ---------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPerson(row: any) {
  return {
    id: row.id,
    name: row.name ?? '',
    company: row.company ?? '',
    role: row.role ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    notes: row.notes ?? '',
    _ownerId: row.user_id as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function personToRow(person: any, currentUserId: string) {
  return {
    id: person.id,
    user_id: person._ownerId || currentUserId,
    name: person.name ?? null,
    company: person.company ?? null,
    role: person.role ?? null,
    email: person.email ?? null,
    phone: person.phone ?? null,
    notes: person.notes ?? null,
  };
}

export async function fetchManualPersons(userId: string, viewAll: boolean) {
  let query = supabase.from('manual_persons').select('*').order('name');
  if (!viewAll) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToPerson);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function persistManualPersons(persons: any[], userId: string, knownIds: Iterable<string>) {
  const rows = persons.map((p) => personToRow(p, userId));
  if (rows.length) {
    const { error } = await supabase.from('manual_persons').upsert(rows);
    if (error) throw error;
  }

  // See persistProperties — only delete rows this client's own snapshot knew
  // about and has since dropped, never rows it simply hasn't fetched yet.
  const currentIds = new Set(persons.map((p) => p.id));
  const toDelete = [...knownIds].filter((id) => !currentIds.has(id));
  if (toDelete.length) {
    const { error: deleteError } = await supabase.from('manual_persons').delete().in('id', toDelete);
    if (deleteError) throw deleteError;
  }
}

// ---------------------------------------------------------------
// Document storage (original uploaded PDFs)
// ---------------------------------------------------------------

export interface StoredDocument {
  name: string;
  path: string;
}

export async function uploadPropertyDocuments(
  files: File[],
  userId: string,
  propertyId: string
): Promise<StoredDocument[]> {
  const results: StoredDocument[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${propertyId}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: false,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Document upload failed:', file.name, error);
      continue;
    }
    results.push({ name: file.name, path });
  }
  return results;
}

export async function getDocumentDownloadUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Signed URL error:', error);
    return null;
  }
  return data?.signedUrl ?? null;
}

// ---------------------------------------------------------------
// PDF extraction (extract-pdf Edge Function)
// ---------------------------------------------------------------

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type ExtractPdfOptions =
  | { mode: 'single' }
  | { mode: 'combined'; propertyType?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function extractPdfData(files: File[], options: ExtractPdfOptions): Promise<any> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Nicht angemeldet.');

  const encoded = await Promise.all(files.map(async (f) => ({ name: f.name, data: await fileToBase64(f) })));
  const body =
    options.mode === 'combined'
      ? { mode: 'combined', files: encoded, propertyType: options.propertyType }
      : { mode: 'single', file: encoded[0] };

  const res = await fetch(`${supabaseUrl}/functions/v1/extract-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(json.error || `Extraktion fehlgeschlagen (${res.status}).`);
  }
  return json;
}
