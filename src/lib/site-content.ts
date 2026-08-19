export interface JobItem {
  id: number;
  title: string;
  department: string;
  employmentType: string[];
  location: string[];
  deadline: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
  /** Hidden postings stay in the admin list but are dropped from the public site. */
  hidden?: boolean;
}

// Closed option lists used by the admin job form — also used server-side to
// drop stale free-text values left over from before these fields were
// closed lists (see site-content-store.ts).
export const JOB_DEPARTMENTS = ["Văn phòng", "Cửa hàng", "Kho"];
export const JOB_EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Xoay ca"];

export interface LocationItem {
  id: number;
  name: string;
  /** Hidden locations stay assignable to jobs that already use them, but drop out of "add to a job" and the admin's list of pickable options. */
  hidden?: boolean;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface CoreValueItem {
  title: string;
  slogan: string;
  description: string;
  gradient: string;
}

export interface SiteContent {
  hero: {
    headingLine1: string;
    headingLine2: string;
    subtitle: string;
  };
  jobs: JobItem[];
  locations: LocationItem[];
  about: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    description: string;
    features: FeatureItem[];
  };
  coreValues: {
    heading: string;
    subtitle: string;
    values: CoreValueItem[];
  };
  footer: {
    tagline: string;
    address: string;
    hotline: string;
    email: string;
    copyright: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    headingLine1: "Tìm kiếm cơ hội đồng hành",
    headingLine2: "cùng Jim Tồ",
    subtitle: "Cùng chúng tôi phục vụ cho hàng triệu mẹ bầu và em bé Việt Nam",
  },
  jobs: [
    {
      id: 63,
      title: "Trưởng nhóm C&B",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "01/01/0001",
      salary: "20 Triệu - 25 Triệu",
      description:
        "Chịu trách nhiệm xây dựng và triển khai chính sách lương thưởng, phúc lợi cho toàn hệ thống Jim Tồ.",
      requirements:
        "- Tốt nghiệp Đại học chuyên ngành Nhân sự, Kinh tế hoặc liên quan\n- Tối thiểu 3 năm kinh nghiệm ở vị trí tương đương\n- Am hiểu luật lao động, bảo hiểm xã hội\n- Kỹ năng phân tích và làm việc với số liệu tốt",
      benefits:
        "- Lương thoả thuận theo năng lực\n- Thưởng KPI, thưởng lễ Tết\n- Bảo hiểm sức khoẻ cao cấp\n- Môi trường làm việc năng động",
    },
    {
      id: 61,
      title: "Middle .NET Backend Developer",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "31/07/2026",
      salary: "18 Triệu - 25 Triệu",
      description:
        "Phát triển và bảo trì hệ thống backend phục vụ nền tảng bán lẻ và tuyển dụng của Jim Tồ.",
      requirements:
        "- Tối thiểu 2 năm kinh nghiệm với .NET Core, C#\n- Thành thạo SQL Server, RESTful API\n- Có kinh nghiệm với Git, CI/CD là lợi thế\n- Tư duy logic tốt, chủ động trong công việc",
      benefits:
        "- Thu nhập cạnh tranh, review lương 2 lần/năm\n- Laptop, thiết bị làm việc đầy đủ\n- Bảo hiểm sức khoẻ, du lịch hàng năm\n- Đào tạo và cơ hội thăng tiến rõ ràng",
    },
    {
      id: 60,
      title: "Thiết kế đồ họa",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "31/07/2026",
      salary: "10 Triệu - 15 Triệu",
      description:
        "Thiết kế hình ảnh truyền thông, ấn phẩm marketing và nội dung hình ảnh cho các kênh của Jim Tồ.",
      requirements:
        "- Thành thạo Photoshop, Illustrator, Canva\n- Có gu thẩm mỹ, sáng tạo\n- Tối thiểu 1 năm kinh nghiệm thiết kế\n- Chịu được áp lực deadline",
      benefits:
        "- Lương thoả thuận theo năng lực\n- Môi trường sáng tạo, cởi mở\n- Được đào tạo thêm về thương hiệu Jim Tồ\n- Thưởng theo dự án",
    },
    {
      id: 59,
      title: "Chuyên viên Phát triển Kinh doanh",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "31/07/2026",
      salary: "10 Triệu - 18 Triệu",
      description:
        "Tìm kiếm, phát triển kênh phân phối và mở rộng thị trường cho hệ thống Jim Tồ.",
      requirements:
        "- Tốt nghiệp Cao đẳng/Đại học\n- Kỹ năng giao tiếp, đàm phán tốt\n- Ưu tiên có kinh nghiệm ngành mẹ và bé, FMCG\n- Chủ động, chịu được áp lực doanh số",
      benefits:
        "- Lương cứng + hoa hồng hấp dẫn\n- Thưởng nóng theo doanh số\n- Hỗ trợ chi phí công tác\n- Cơ hội thăng tiến lên quản lý",
    },
    {
      id: 58,
      title: "Quản lý ngành hàng",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "20/07/2026",
      salary: "20 Triệu - 30 Triệu",
      description:
        "Quản lý danh mục sản phẩm, làm việc với nhà cung cấp và tối ưu doanh thu ngành hàng phụ trách.",
      requirements:
        "- Tối thiểu 2 năm kinh nghiệm quản lý ngành hàng, mua hàng\n- Kỹ năng đàm phán, phân tích số liệu tốt\n- Am hiểu thị trường mẹ và bé là lợi thế\n- Khả năng làm việc độc lập, chịu trách nhiệm cao",
      benefits:
        "- Thu nhập cạnh tranh + thưởng theo hiệu quả kinh doanh\n- Bảo hiểm sức khoẻ cao cấp\n- Chế độ nghỉ phép, du lịch hàng năm\n- Lộ trình thăng tiến rõ ràng",
    },
    {
      id: 57,
      title: "Trưởng nhóm Livestream",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "19/07/2026",
      salary: "12 Triệu - 15 Triệu",
      description:
        "Xây dựng kịch bản, quản lý đội ngũ livestream bán hàng trên các nền tảng thương mại điện tử.",
      requirements:
        "- Có kinh nghiệm livestream bán hàng/quản lý nhóm livestream\n- Giọng nói rõ ràng, tự tin trước ống kính\n- Nắm bắt xu hướng mạng xã hội tốt\n- Kỹ năng quản lý đội nhóm",
      benefits:
        "- Lương cứng + thưởng doanh số livestream\n- Được đào tạo kỹ năng lên hình chuyên nghiệp\n- Môi trường trẻ trung, năng động\n- Thưởng nóng theo phiên live",
    },
    {
      id: 56,
      title: "Kế toán tổng hợp",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "11/07/2026",
      salary: "18 Triệu - 25 Triệu",
      description:
        "Thực hiện công tác kế toán tổng hợp, hạch toán và lập báo cáo tài chính định kỳ.",
      requirements:
        "- Tốt nghiệp Đại học chuyên ngành Kế toán/Kiểm toán\n- Tối thiểu 2 năm kinh nghiệm kế toán tổng hợp\n- Thành thạo phần mềm kế toán, Excel\n- Cẩn thận, trung thực, chịu được áp lực",
      benefits:
        "- Lương thoả thuận theo năng lực\n- Thưởng lễ Tết, thưởng hiệu quả công việc\n- Bảo hiểm đầy đủ theo quy định\n- Môi trường làm việc ổn định, chuyên nghiệp",
    },
    {
      id: 55,
      title: "Trưởng nhóm Kế toán thuế",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "11/07/2026",
      salary: "16 Triệu - 18 Triệu",
      description:
        "Quản lý công tác kê khai, quyết toán thuế và đảm bảo tuân thủ quy định pháp luật thuế.",
      requirements:
        "- Tối thiểu 3 năm kinh nghiệm kế toán thuế\n- Am hiểu luật thuế hiện hành\n- Kỹ năng quản lý nhóm, làm việc với cơ quan thuế\n- Cẩn thận, chịu trách nhiệm cao",
      benefits:
        "- Thu nhập cạnh tranh theo năng lực\n- Thưởng hiệu quả công việc\n- Bảo hiểm sức khoẻ cao cấp\n- Cơ hội phát triển lên vị trí quản lý cao hơn",
    },
    {
      id: 54,
      title: "Thực tập sinh Tuyển dụng",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "11/07/2026",
      salary: "2 Triệu",
      description:
        "Hỗ trợ bộ phận Nhân sự trong công tác đăng tin, sàng lọc hồ sơ và sắp xếp lịch phỏng vấn.",
      requirements:
        "- Sinh viên năm cuối hoặc mới tốt nghiệp ngành Nhân sự, QTKD\n- Kỹ năng giao tiếp, sắp xếp công việc tốt\n- Thành thạo tin học văn phòng\n- Ham học hỏi, có thể đi làm ít nhất 4 buổi/tuần",
      benefits:
        "- Hỗ trợ chi phí thực tập\n- Được đào tạo bài bản về tuyển dụng\n- Cơ hội trở thành nhân viên chính thức\n- Môi trường thân thiện, hỗ trợ nhiệt tình",
    },
    {
      id: 53,
      title: "Chuyên viên Nhập khẩu",
      department: "Văn phòng",
      employmentType: ["Full-time"],
      location: ["Phường Hạc Thành"],
      deadline: "14/07/2026",
      salary: "10 Triệu - 16 Triệu",
      description:
        "Thực hiện các thủ tục nhập khẩu hàng hoá, làm việc với đối tác quốc tế và hải quan.",
      requirements:
        "- Tốt nghiệp Đại học chuyên ngành Xuất nhập khẩu, Ngoại thương\n- Tiếng Anh giao tiếp tốt\n- Am hiểu quy trình hải quan, logistics\n- Cẩn thận, có khả năng xử lý tình huống",
      benefits:
        "- Lương thoả thuận theo năng lực\n- Thưởng hiệu quả công việc\n- Bảo hiểm sức khoẻ, du lịch hàng năm\n- Môi trường làm việc quốc tế hoá",
    },
  ],
  locations: [
    { id: 1, name: "Phường Hạc Thành" },
    { id: 2, name: "Sầm Sơn" },
    { id: 3, name: "Yên Định" },
    { id: 4, name: "Thiệu Hoá" },
    { id: 5, name: "Quảng Xương" },
    { id: 6, name: "Triệu Sơn" },
  ],
  about: {
    eyebrow: "Hành Trình Phát Triển",
    heading: "Về Chúng Tôi",
    subtitle: "Đồng hành cùng hàng triệu ba mẹ và trẻ em Việt Nam hơn 10 năm qua",
    description:
      "Được thành lập vào năm 2015, Hệ thống cửa hàng Mẹ & Bé Jim Tồ thuộc quyền quản lý của Công ty cổ phần Momkid Việt Nam, chuyên cung cấp các giải pháp chăm sóc sức khỏe và sản phẩm cao cấp dành cho mẹ và bé.",
    features: [
      {
        title: "Hệ Thống Uy Tín Số 1",
        description:
          "Hơn 10 năm hình thành và phát triển, dành được sự tin tưởng và yêu thương từ hàng trăm nghìn bà mẹ toàn quốc.",
      },
      {
        title: "Sản Phẩm An Toàn & Đa Dạng",
        description:
          "Đầy đủ các sản phẩm từ các thương hiệu hàng đầu Việt và thế giới (Aptamil, Merries, Nature's way, NutiFood...) được chứng nhận an toàn tuyệt đối cho mẹ và bé.",
      },
      {
        title: "Kiến Thức Bài Bản",
        description:
          "Nhân viên được đào tạo về kiến thức, kỹ năng và thái độ, sẵn sàng lắng nghe và phục vụ.",
      },
    ],
  },
  coreValues: {
    heading: "Giá Trị Cốt Lõi",
    subtitle: "Nền tảng phát triển bền vững và tinh thần Jim Tồ",
    values: [
      {
        title: "Trung Thực",
        slogan: "Nói thật, làm thật",
        description: "Minh bạch trong từng cam kết, chân thành trong từng lời khuyên cho ba mẹ.",
        gradient: "linear-gradient(135deg, #F66A9C 0%, #EC4176 100%)",
      },
      {
        title: "Yêu Thương",
        slogan: "Trao yêu thương, nhận nụ cười",
        description: "Đặt trái tim vào từng sản phẩm, từng dịch vụ dành cho mẹ và bé.",
        gradient: "linear-gradient(135deg, #FFA98B 0%, #FF7A59 100%)",
      },
      {
        title: "Học Tập",
        slogan: "Mỗi ngày một tốt hơn",
        description:
          "Không ngừng lắng nghe, học hỏi và cải tiến để đồng hành cùng gia đình Việt.",
        gradient: "linear-gradient(135deg, #A78BFA 0%, #7C6FE0 100%)",
      },
    ],
  },
  footer: {
    tagline: "Nền tảng bán lẻ đa kênh tiên phong",
    address: "306 Nguyễn Trãi, phường Hạc Thành, tỉnh Thanh Hoá",
    hotline: "1800.0046",
    email: "tuyetnhi@jimto.vn",
    copyright: "© 2026 Jim Tồ Recruitment",
  },
};
