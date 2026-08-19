// Shared between the client (ApplyModal renders this) and the server
// (lark.ts writes it to the "(NEW) Form tuyển dụng" table) so the two never
// drift apart. `key` is the *exact* Lark column name — resolved
// case-insensitively server-side, so a column rename there still works, but
// a genuinely deleted column just gets skipped instead of failing the whole
// submission.

export const SALES_POSITION_TITLE = "Tư vấn bán hàng";

/**
 * Whether a job title should use the 2-step sales screening form. Matches
 * by substring rather than exact equality — the live posting is titled
 * "TƯ VẤN BÁN HÀNG" (no "Nhân viên" prefix), and HR may retitle it again
 * later ("Tư vấn bán hàng (Full-time)", etc.); this keeps matching as long
 * as the core phrase is present, case/diacritic-position aside.
 */
export function isSalesPositionTitle(title: string): boolean {
  return title.trim().toLowerCase().includes(SALES_POSITION_TITLE.toLowerCase());
}

export type Step2FieldType = "text" | "date" | "radio";

export interface Step2FieldDef {
  key: string;
  label: string;
  hint?: string;
  type: Step2FieldType;
  required: boolean;
  options?: string[];
}

export const SALES_STEP2_FIELDS: Step2FieldDef[] = [
  {
    key: "Ngày/tháng/năm sinh",
    label: "Ngày/tháng/năm sinh",
    type: "date",
    required: true,
  },
  {
    key: "Giới tính",
    label: "Giới tính",
    type: "radio",
    required: true,
    options: ["Nam", "Nữ"],
  },
  {
    key: "Chiều cao",
    label: "Chiều cao",
    type: "text",
    required: true,
  },
  {
    key: "Cân nặng",
    label: "Cân nặng",
    type: "text",
    required: true,
  },
  {
    key: "Chỗ ở hiện tại của bạn",
    label: "Chỗ ở hiện tại của bạn",
    type: "text",
    required: true,
  },
  {
    key: "Bạn biết thông tin tuyển dụng của Jim Tồ qua kênh nào?",
    label: "Bạn biết thông tin tuyển dụng của Jim Tồ qua kênh nào?",
    type: "text",
    required: true,
  },
  {
    key: "Tình trạng hôn nhân",
    label: "Tình trạng hôn nhân",
    hint: "Bạn đã có gia đình và con hay chưa?",
    type: "radio",
    required: true,
    options: [
      "Sẽ lập gia đình trong 06 tháng tới",
      "Đã lập gia đình - chưa có con",
      "Đã lập gia đình - đã có con",
      "Chưa có kế hoạch lập gia đình",
    ],
  },
  {
    key: "Con nhỏ nhất của bạn mấy tháng tuổi? (nếu đã có con) 2",
    label: "Con nhỏ nhất của bạn mấy tháng tuổi? (nếu đã có con)",
    type: "text",
    required: false,
  },
  {
    key: "Tình trạng thai sản",
    label: "Tình trạng thai sản",
    type: "radio",
    required: true,
    options: [
      "Chưa có dự định mang thai",
      "Dự định mang thai trong 01 năm tới",
      "Đang mang thai",
      "Tôi là nam nên không thể mang thai",
    ],
  },
  {
    key: "Trình độ bằng cấp",
    label: "Trình độ bằng cấp",
    type: "radio",
    required: true,
    options: ["Đã tốt nghiệp cấp 3", "Trung cấp", "Cao đẳng", "Đại học", "Đã tốt nghiệp cấp 2"],
  },
  {
    key: "Chuyên ngành",
    label: "Chuyên ngành",
    hint: "Nếu bạn đã từng học một chuyên ngành nào đó, hãy cho chúng tôi biết",
    type: "text",
    required: false,
  },
  {
    key: "Bạn dự định gắn bó với công việc bao lâu? 2",
    label: "Bạn dự định gắn bó với công việc bao lâu?",
    type: "text",
    required: false,
  },
  {
    key: "Kinh nghiệm làm việc (nếu có)",
    label: "Kinh nghiệm làm việc (nếu có)",
    hint: "Bạn đã từng làm việc ở đâu chưa? Cụ thể những việc bạn đã làm là gì? Mức lương cho từng công việc đó là bao nhiêu?",
    type: "text",
    required: true,
  },
  {
    key: "Nếu đã từng làm việc ở nơi khác, vì sao bạn nghĩ ở chỗ cũ?",
    label: "Nếu đã từng làm việc ở nơi khác, vì sao bạn nghĩ ở chỗ cũ?",
    type: "text",
    required: true,
  },
  {
    key: "Thế mạnh của bạn là gì?",
    label: "Thế mạnh của bạn là gì?",
    hint: "Điều gì khiến bạn tự hào về mình nhất?",
    type: "text",
    required: true,
  },
  {
    key: "Điểm yếu của bạn là gì?",
    label: "Điểm yếu của bạn là gì?",
    type: "text",
    required: true,
  },
  {
    key: "Tự chấm điểm ở mức độ trung thực của bản thân bạn cho mình mấy điểm( thang điểm từ 1-10)",
    label:
      "Tự chấm điểm ở mức độ trung thực của bản thân bạn cho mình mấy điểm (thang điểm từ 1-10)",
    type: "text",
    required: true,
  },
  {
    key: "Dự định của bạn trong 3 năm tới là gì?",
    label: "Dự định của bạn trong 3 năm tới là gì?",
    type: "text",
    required: true,
  },
  {
    key: "Vấn đề quan tâm",
    label: "Vấn đề quan tâm",
    hint: "Chọn 1 vấn đề mà bạn quan tâm khi hợp tác với chúng tôi",
    type: "radio",
    required: true,
    options: ["Mức lương", "Được học hỏi", "Thời gian làm việc", "Môi trường làm việc"],
  },
  {
    key: "Bạn tìm kiếm mức thu nhập bao nhiêu cho công việc sắp tới?",
    label: "Bạn tìm kiếm mức thu nhập bao nhiêu cho công việc sắp tới?",
    type: "text",
    required: true,
  },
  {
    key: "Bạn dự kiến gắn bó với công việc bao lâu? 2",
    label: "Bạn dự kiến gắn bó với công việc bao lâu?",
    type: "text",
    required: true,
  },
  {
    key: "Thời gian bắt đầu",
    label: "Thời gian bắt đầu",
    hint: "Khi nào bạn có thể bắt đầu công việc?",
    type: "date",
    required: true,
  },
  {
    key: "Địa chỉ Facebook của bạn ( copy địa chỉ Facebook)",
    label: "Địa chỉ Facebook của bạn (copy địa chỉ Facebook)",
    type: "text",
    required: true,
  },
  {
    key: "Câu hỏi mở",
    label: "Câu hỏi mở",
    type: "text",
    required: false,
  },
];
