const LARK_API_BASE = "https://open.larksuite.com/open-apis";

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface FieldInfo {
  name: string;
  type: number;
}

/** Lark field type code for Date/DateTime columns. */
const DATE_FIELD_TYPE = 5;

// Applications for this exact job title go to the original web table
// (LARK_TABLE_NAME); every other position goes to the shared HR sheet
// (LARK_TABLE_NAME_OTHER, "DATA TUYỂN DỤNG") instead, since that's the one
// recruiters already work from for every non-sales-floor role.
const SALES_POSITION_TITLE = "nhân viên tư vấn bán hàng";

let cachedToken: CachedToken | null = null;
const tableIdCache = new Map<string, string>(); // table name -> table_id
const fieldsCache = new Map<string, FieldInfo[]>(); // table_id -> fields

async function getTenantAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET,
    }),
  });
  const data = (await res.json()) as {
    code: number;
    msg: string;
    tenant_access_token?: string;
    expire?: number;
  };

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Lark auth failed: ${data.msg} (code ${data.code})`);
  }

  cachedToken = {
    token: data.tenant_access_token,
    // Refresh a couple of minutes early to be safe.
    expiresAt: Date.now() + (data.expire ?? 7200) * 1000 - 2 * 60 * 1000,
  };
  return cachedToken.token;
}

async function findTableId(token: string, tableName: string): Promise<string> {
  const cached = tableIdCache.get(tableName);
  if (cached) return cached;

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables?page_size=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { items?: { table_id: string; name: string }[] };
  };

  if (data.code !== 0) {
    throw new Error(`Lark list tables failed: ${data.msg} (code ${data.code})`);
  }

  const match = data.data?.items?.find((t) => t.name === tableName);
  if (!match) {
    const names = data.data?.items?.map((t) => t.name).join(", ") ?? "(không có bảng nào)";
    throw new Error(`Không tìm thấy bảng "${tableName}" trong Base. Các bảng hiện có: ${names}`);
  }

  tableIdCache.set(tableName, match.table_id);
  return match.table_id;
}

/** Normalizes a name for case/whitespace-insensitive matching. */
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

async function getFields(token: string, tableId: string): Promise<FieldInfo[]> {
  const cached = fieldsCache.get(tableId);
  if (cached) return cached;

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/fields?page_size=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = (await res.json()) as {
    code: number;
    data?: { items?: { field_name: string; type: number }[] };
  };

  const fields = (data.data?.items ?? []).map((f) => ({ name: f.field_name, type: f.type }));
  fieldsCache.set(tableId, fields);
  return fields;
}

function resolveFieldName(fields: FieldInfo[], expectedName: string): string {
  const match = fields.find((f) => normalize(f.name) === normalize(expectedName));
  if (!match) {
    throw new Error(
      `Không tìm thấy cột "${expectedName}" trong bảng. Các cột hiện có: ` +
        fields.map((f) => f.name).join(", "),
    );
  }
  return match.name;
}

/** Like resolveFieldName, but for optional columns — missing is fine. */
function tryResolveFieldName(fields: FieldInfo[], expectedName: string): string | null {
  return fields.find((f) => normalize(f.name) === normalize(expectedName))?.name ?? null;
}

async function uploadFileToLark(token: string, file: File): Promise<string> {
  const appToken = process.env.LARK_BASE_APP_TOKEN;

  const form = new FormData();
  form.append("file_name", file.name);
  form.append("parent_type", "bitable_file");
  form.append("parent_node", appToken ?? "");
  form.append("size", String(file.size));
  form.append("file", file);

  const res = await fetch(`${LARK_API_BASE}/drive/v1/medias/upload_all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { file_token: string };
  };

  if (data.code !== 0 || !data.data?.file_token) {
    throw new Error(`Lark file upload failed: ${data.msg} (code ${data.code})`);
  }
  return data.data.file_token;
}

type RecordFields = Record<string, string | number | { file_token: string }[]>;

async function createRecord(token: string, tableId: string, fields: RecordFields) {
  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );
  const data = (await res.json()) as { code: number; msg: string };
  if (data.code !== 0) {
    throw new Error(`Lark create record failed: ${data.msg} (code ${data.code})`);
  }
}

export interface ApplicationSubmission {
  name: string;
  phone: string;
  email: string;
  position: string;
  /** Candidate's preferred work location(s), when the posting spans more than one. */
  location?: string;
  cvFile?: File | null;
}

// "Danh sách ứng tuyển qua web" — Ngày, Họ tên, Số điện thoại, Email, Vị
// trí, CV, Trạng thái, Ghi chú.
async function submitToWebTable(token: string, submission: ApplicationSubmission) {
  const tableId = await findTableId(token, process.env.LARK_TABLE_NAME ?? "");
  const fields = await getFields(token, tableId);

  const dateField = fields.find(
    (f) => normalize(f.name) === "ngày" || f.type === DATE_FIELD_TYPE,
  );

  const record: RecordFields = {
    [resolveFieldName(fields, "họ tên")]: submission.name,
    [resolveFieldName(fields, "số điện thoại")]: submission.phone,
    [resolveFieldName(fields, "email")]: submission.email,
    [resolveFieldName(fields, "vị trí")]: submission.position,
  };
  if (dateField) {
    record[dateField.name] =
      dateField.type === DATE_FIELD_TYPE ? Date.now() : new Date().toLocaleDateString("vi-VN");
  }
  if (submission.cvFile && submission.cvFile.size > 0) {
    const fileToken = await uploadFileToLark(token, submission.cvFile);
    record[resolveFieldName(fields, "cv")] = [{ file_token: fileToken }];
  }
  if (submission.location) {
    const notesField = tryResolveFieldName(fields, "ghi chú");
    if (notesField) {
      record[notesField] = `Địa điểm mong muốn: ${submission.location}`;
    }
  }

  await createRecord(token, tableId, record);
}

// "DATA TUYỂN DỤNG" — the shared HR sheet for every other position. Vị trí
// ứng tuyển and Vị trí làm việc are single-select columns; Lark auto-adds a
// new option the first time a value that doesn't exist yet is written, so
// new job titles/locations just work without any manual setup in Lark.
async function submitToGeneralTable(token: string, submission: ApplicationSubmission) {
  const tableName = process.env.LARK_TABLE_NAME_OTHER;
  if (!tableName) {
    throw new Error("LARK_TABLE_NAME_OTHER is not configured");
  }
  const tableId = await findTableId(token, tableName);
  const fields = await getFields(token, tableId);

  const record: RecordFields = {
    [resolveFieldName(fields, "họ và tên")]: submission.name,
    [resolveFieldName(fields, "sđt")]: submission.phone,
    [resolveFieldName(fields, "email")]: submission.email,
    [resolveFieldName(fields, "vị trí ứng tuyển")]: submission.position,
  };

  const sourceField = tryResolveFieldName(fields, "nguồn");
  if (sourceField) {
    record[sourceField] = "Web";
  }

  if (submission.location) {
    const locations = submission.location
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    const workLocationField = tryResolveFieldName(fields, "vị trí làm việc");
    if (workLocationField && locations[0]) {
      record[workLocationField] = locations[0];
    }
    const notesField = tryResolveFieldName(fields, "ghi chú");
    if (notesField) {
      record[notesField] = `Địa điểm mong muốn: ${submission.location}`;
    }
  }

  if (submission.cvFile && submission.cvFile.size > 0) {
    const fileToken = await uploadFileToLark(token, submission.cvFile);
    record[resolveFieldName(fields, "cv ứng viên")] = [{ file_token: fileToken }];
  }

  await createRecord(token, tableId, record);
}

export async function submitApplicationToLark(submission: ApplicationSubmission) {
  const token = await getTenantAccessToken();
  const isSalesPosition = normalize(submission.position) === SALES_POSITION_TITLE;

  if (isSalesPosition) {
    await submitToWebTable(token, submission);
  } else {
    await submitToGeneralTable(token, submission);
  }
}
