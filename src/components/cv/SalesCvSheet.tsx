import { Dancing_Script } from "next/font/google";
import {
  Briefcase,
  GraduationCap,
  Heart,
  House,
  MessageCircleQuestion,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";
import type { SalesCv } from "@/lib/sales-cv";

// Rebuild of HCNS's "CV XIN VIỆC" template (docs/design-references/
// cv-template.pdf) — same sections, same option lists, filled from Lark.
// Options mirror the Lark single-select columns exactly (the template was
// redrawn to match them), so an answer outside the list is still printed
// via the "Khác" line instead of silently vanishing.

const script = Dancing_Script({ subsets: ["latin", "vietnamese"], weight: ["500", "600"] });

const MARITAL_OPTIONS = [
  "Sẽ lập gia đình trong 06 tháng tới",
  "Đã lập gia đình - chưa có con",
  "Đã lập gia đình - đã có con",
  "Chưa có kế hoạch lập gia đình",
];
const MATERNITY_OPTIONS = [
  "Chưa có dự định mang thai",
  "Dự định mang thai trong 01 năm tới",
  "Đang mang thai",
  "Tôi là nam nên không thể mang thai",
];
const EDUCATION_OPTIONS = [
  "Đã tốt nghiệp cấp 2",
  "Đã tốt nghiệp cấp 3",
  "Trung cấp",
  "Cao đẳng",
  "Đại học",
];

function same(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function Section({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "break-inside-avoid rounded-2xl border border-[#f5bfd1] bg-white/90 pb-3",
        className,
      )}
    >
      <header className="relative flex items-center">
        <span className="z-10 -ml-1 -mt-1 grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-white bg-brand text-white shadow-sm">
          <Icon className="size-5" fill="currentColor" strokeWidth={1.5} />
        </span>
        <h2 className="-ml-4 -mt-1 flex min-h-9 flex-1 items-center rounded-r-2xl bg-gradient-to-r from-brand via-[#f77fa3] to-[#fde3ec] py-1.5 pl-7 pr-3 text-[15px] font-extrabold uppercase leading-tight text-white">
          {title}
        </h2>
      </header>
      <div className="space-y-2 px-4 pt-3">{children}</div>
    </section>
  );
}

/** Label + value on a dotted line; an empty value leaves the line blank for handwriting. */
function Line({
  label,
  value,
  className,
  multiline,
}: {
  label: string;
  value?: string;
  className?: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <div className={className}>
        <p className="text-[13px] text-[#4b4b55]">{label}</p>
        <p className="min-h-12 whitespace-pre-line border-b border-dotted border-[#e3a3b8] bg-[linear-gradient(transparent_23px,#f1c4d3_24px)] bg-[length:100%_24px] pb-0.5 text-[13.5px] font-semibold leading-6 text-[#1f1f29]">
          {value}
        </p>
      </div>
    );
  }
  return (
    <div className={cn("flex items-baseline gap-2 text-[13px]", className)}>
      <span className="shrink-0 text-[#4b4b55]">{label}</span>
      <span className="min-h-5 flex-1 whitespace-pre-line border-b border-dotted border-[#e3a3b8] pb-0.5 text-[13.5px] font-semibold leading-snug text-[#1f1f29]">
        {/* zero-width space keeps a baseline so an empty line aligns with its label */}
        {value || "\u200b"}
      </span>
    </div>
  );
}

function Radio({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="inline-flex items-start gap-2 text-[13px] leading-snug text-[#3a3a44]">
      <span
        className={cn(
          "mt-px grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]",
          checked ? "border-brand bg-brand" : "border-[#e79ab3] bg-white",
        )}
      >
        {checked && <span className="size-1.5 rounded-full bg-white" />}
      </span>
      <span className={cn(checked && "font-bold text-brand-dark")}>{label}</span>
    </span>
  );
}

/** Option list; a value that matches none of the options is shown on a "Khác" line. */
function Choices({
  options,
  value,
  className,
}: {
  options: string[];
  value: string;
  className?: string;
}) {
  const matched = options.some((o) => same(o, value));
  return (
    <>
      <div className={cn("flex flex-col gap-1.5", className)}>
        {options.map((o) => (
          <Radio key={o} label={o} checked={same(o, value)} />
        ))}
      </div>
      {value && !matched && <Line label="Khác:" value={value} />}
    </>
  );
}

export function SalesCvSheet({ cv }: { cv: SalesCv }) {
  return (
    <article data-cv-sheet className="relative mx-auto w-full max-w-[210mm] overflow-hidden bg-[#fff5f8] px-4 pb-6 pt-5 text-[#1f1f29] sm:px-8 print:max-w-none print:[zoom:0.8] print:px-[9mm] print:pb-[6mm] print:pt-[7mm]">
      {/* soft cloud at the bottom, like the template */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(ellipse_at_20%_100%,#fbd3e0_0%,transparent_60%),radial-gradient(ellipse_at_80%_100%,#fbd3e0_0%,transparent_55%)]"
      />

      <header className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Logo className="h-14 w-auto sm:h-16" />
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-wide text-brand sm:text-base">
            Thông tin ứng tuyển
          </p>
          <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-brand sm:text-[42px]">
            CV xin việc
          </h1>
          <p className={cn(script.className, "mt-1 text-lg text-[#c2577a] sm:text-xl")}>
            Cùng JimTồ lan tỏa yêu thương!
          </p>
        </div>
        <Heart className="hidden size-12 text-[#f06d97] sm:block" fill="currentColor" strokeWidth={0} />
      </header>

      <div className="relative mt-5 grid gap-4 md:grid-cols-[1.45fr_1fr] print:grid-cols-[1.45fr_1fr]">
        <Section icon={User} title="1. Thông tin cá nhân">
          <Line label="Họ và tên:" value={cv.name} />
          <Line label="Ngày/tháng/năm sinh:" value={cv.birthDate} />
          <div className="flex items-center gap-5 text-[13px]">
            <span className="text-[#4b4b55]">Giới tính:</span>
            <Radio label="Nữ" checked={same(cv.gender, "Nữ")} />
            <Radio label="Nam" checked={same(cv.gender, "Nam")} />
          </div>
          <Line label="Số điện thoại:" value={cv.phone} />
          <Line label="Địa chỉ hiện tại:" value={cv.address} />
          <div className="grid grid-cols-2 gap-4">
            <Line label="Chiều cao:" value={cv.height} />
            <Line label="Cân nặng:" value={cv.weight} />
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 text-[13px] text-[#4b4b55]">Tình trạng hôn nhân:</span>
            <div className="flex-1 space-y-1.5">
              <Choices options={MARITAL_OPTIONS} value={cv.marital} />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1.4fr] gap-4">
            <Line label="Số người con:" value={cv.childrenCount} />
            <Line label="Tuổi con nhỏ nhất:" value={cv.youngestChildAge} />
          </div>
        </Section>

        <Section icon={House} title={<>2. Tình trạng gia đình &amp; thời gian làm việc</>}>
          <p className="text-[13px] text-[#4b4b55]">Tình trạng thai sản hiện tại:</p>
          <Choices options={MATERNITY_OPTIONS} value={cv.maternity} className="gap-2.5 pl-1" />
        </Section>

        <Section icon={Briefcase} title="3. Thông tin ứng tuyển">
          <Line label="Vị trí ứng tuyển:" value={cv.position} />
          <Line label="Chi nhánh mong muốn:" value={cv.branch} />
          <div className="flex items-center gap-5 text-[13px]">
            <span className="text-[#4b4b55]">Full-time / Part-time:</span>
            <Radio label="Full-time" checked={same(cv.workType, "Full-time")} />
            <Radio label="Part-time" checked={same(cv.workType, "Part-time")} />
          </div>
          <Line label="Thời gian có thể bắt đầu làm việc:" value={cv.startDate} />
          <Line label="Mức lương mong muốn:" value={cv.expectedSalary} />
          <Line label="Dự định tương lai:" value={cv.futurePlan} multiline />
          <Line label="Dự định gắn bó trong bao lâu:" value={cv.commitment} />
        </Section>

        <Section icon={GraduationCap} title="4. Học vấn">
          <p className="text-[13px] text-[#4b4b55]">Trình độ bằng cấp:</p>
          <Choices
            options={EDUCATION_OPTIONS}
            value={cv.education}
            className="grid grid-cols-2 gap-x-3 gap-y-2 pl-1"
          />
          <Line label="Tên trường / chuyên ngành:" value={cv.major} multiline />
          <Line label="Năm tốt nghiệp:" value={cv.graduationYear} />
          <Line label="Các chứng chỉ khác (nếu có):" value={cv.certificates} multiline />
        </Section>

        <Section
          icon={Star}
          title="5. Kinh nghiệm làm việc"
          className="md:col-span-2 print:col-span-2"
        >
          <Line label="Kinh nghiệm làm việc:" value={cv.experience} multiline />
          <Line label="Lý do nghỉ việc:" value={cv.leaveReason} multiline />
          <div className="grid gap-4 sm:grid-cols-2 sm:divide-x sm:divide-[#f5bfd1] print:grid-cols-2">
            <Line label="Thế mạnh:" value={cv.strengths} multiline />
            <Line label="Điểm yếu:" value={cv.weaknesses} multiline className="sm:pl-4 print:pl-4" />
          </div>
        </Section>

        {/* Not part of HCNS's template — only added when the candidate wrote something. */}
        {cv.openQuestion && (
          <Section
            icon={MessageCircleQuestion}
            title="6. Câu hỏi mở"
            className="md:col-span-2 print:col-span-2"
          >
            <Line label="Ứng viên muốn hỏi / chia sẻ thêm:" value={cv.openQuestion} multiline />
          </Section>
        )}
      </div>

      <p
        className={cn(
          script.className,
          "relative mt-5 flex items-center justify-center gap-3 text-lg text-[#c2577a]",
        )}
      >
        <Heart className="size-4 text-brand" fill="currentColor" strokeWidth={0} />
        Cảm ơn bạn đã dành thời gian điền thông tin!
        <Heart className="size-4 text-brand" fill="currentColor" strokeWidth={0} />
      </p>
    </article>
  );
}
