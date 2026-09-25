// Maps a raw "(NEW) Form tuyển dụng" record onto the fields of HCNS's
// printable CV template (docs/design-references/cv-template.pdf). Column
// names are matched case/whitespace-insensitively like lark.ts, and a
// renamed/missing column just renders as an empty line for handwriting —
// never a crash — including records submitted before a question existed
// (Số người con, Full-time/Part-time, Năm tốt nghiệp, Chứng chỉ were added
// 25/09/2026, so older applications leave those lines blank).

export interface SalesCv {
  name: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  height: string;
  weight: string;
  marital: string;
  childrenCount: string;
  youngestChildAge: string;
  maternity: string;
  position: string;
  branch: string;
  workType: string;
  startDate: string;
  expectedSalary: string;
  futurePlan: string;
  commitment: string;
  education: string;
  major: string;
  graduationYear: string;
  certificates: string;
  experience: string;
  leaveReason: string;
  strengths: string;
  weaknesses: string;
  submittedAt: string;
}

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function toText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toText).join("").trim();
  if (typeof value === "object" && "text" in value) return toText(value.text);
  return "";
}

// Lark lưu ô ngày là epoch ms. Máy chủ Vercel chạy UTC, còn ngày nhập từ web
// là 00:00 UTC và từ form Lark cũ là 00:00 giờ VN (= 17:00 UTC hôm trước) —
// ép hiển thị theo giờ VN thì cả hai đều ra đúng ngày.
function toDate(value: unknown, withTime = false): string {
  if (typeof value !== "number") return toText(value);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(value);
}

export function toSalesCv(raw: Record<string, unknown>): SalesCv {
  const byName = new Map(Object.entries(raw).map(([k, v]) => [normalize(k), v]));
  const get = (...names: string[]) => {
    for (const n of names) {
      const v = toText(byName.get(normalize(n)));
      if (v) return v;
    }
    return "";
  };
  const getDate = (name: string, withTime = false) => toDate(byName.get(normalize(name)), withTime);

  return {
    name: get("Họ Tên"),
    birthDate: getDate("Ngày/tháng/năm sinh"),
    gender: get("Giới tính"),
    phone: get("Số điện thoại liên hệ"),
    address: get("Chỗ ở hiện tại của bạn"),
    height: get("Chiều cao"),
    weight: get("Cân nặng"),
    marital: get("Tình trạng hôn nhân"),
    childrenCount: get("Số người con"),
    youngestChildAge: get("Con nhỏ nhất của bạn mấy tháng tuổi? (nếu đã có con) 2"),
    maternity: get("Tình trạng thai sản"),
    position: get("Vị trí ứng tuyển"),
    branch: get("Bạn mong muốn làm việc chi nhánh nào( Dành cho vị trí tư vấn viên)"),
    workType: get("Full-time / Part-time"),
    startDate: getDate("Thời gian bắt đầu"),
    expectedSalary: get("Bạn tìm kiếm mức thu nhập bao nhiêu cho công việc sắp tới?"),
    futurePlan: get("Dự định của bạn trong 3 năm tới là gì?"),
    // Web ghi vào cột "dự kiến"; cột "dự định" là của form Lark cũ.
    commitment: get(
      "Bạn dự kiến gắn bó với công việc bao lâu? 2",
      "Bạn dự định gắn bó với công việc bao lâu? 2",
    ),
    education: get("Trình độ bằng cấp"),
    major: get("Chuyên ngành"),
    graduationYear: get("Năm tốt nghiệp"),
    certificates: get("Các chứng chỉ khác (nếu có)"),
    experience: get("Kinh nghiệm làm việc (nếu có)"),
    leaveReason: get("Nếu đã từng làm việc ở nơi khác, vì sao bạn nghĩ ở chỗ cũ?"),
    strengths: get("Thế mạnh của bạn là gì?"),
    weaknesses: get("Điểm yếu của bạn là gì?"),
    submittedAt: getDate("Submitted on", true),
  };
}
