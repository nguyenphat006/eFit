/**
 * Bảng Hằng Số Phân Quyền Toàn Cục (Single Source of Truth cho Frontend RBAC).
 * Giúp chống lỗi chính tả (Zero Typos), hỗ trợ IDE IntelliSense Auto-complete 100%
 * và kiểm tra kiểu tĩnh (Compile-Time Type Safety) trên toàn bộ dự án.
 */
export const PERMISSIONS = {
  USER: {
    /** Quyền vào trang Quản lý Người dùng (/users) & hiển thị menu Sidebar */
    VIEW: "USER_VIEW",
    /** Quyền gọi API đọc danh sách, chi tiết người dùng và số liệu KPI */
    READ: "USER_READ",
    /** Quyền mở form và gọi API tạo mới tài khoản người dùng */
    CREATE: "USER_CREATE",
    /** Quyền chỉnh sửa thông tin, đổi vai trò, đổi trạng thái hoạt động */
    UPDATE: "USER_UPDATE",
    /** Quyền xóa tài khoản */
    DELETE: "USER_DELETE",
    /** Quyền xuất danh sách người dùng ra định dạng Excel / CSV */
    EXPORT: "USER_EXPORT",
    /** Quyền nhập danh sách người dùng từ file */
    IMPORT: "USER_IMPORT",
  },
  AUDIT_LOGS: {
    /** Quyền vào trang Nhật ký thao tác (/audit-logs) & hiển thị menu */
    VIEW: "AUDIT_LOGS_VIEW",
    /** Quyền đọc nhật ký (trang nhật ký + tab "Nhật ký hoạt động" ở trang chi tiết) */
    READ: "AUDIT_LOGS_READ",
    /** Quyền xuất nhật ký ra file */
    EXPORT: "AUDIT_LOGS_EXPORT",
  },
  SETTINGS: {
    /** Quyền vào trang Cài đặt Phân hệ & Ma trận Quyền */
    VIEW: "SETTINGS_VIEW",
    /** Quyền đọc danh sách phân hệ và ma trận quyền */
    READ: "SETTINGS_READ",
    /** Quyền đăng ký phân hệ mới và thêm action */
    CREATE: "SETTINGS_CREATE",
    /** Quyền chỉnh sửa phân hệ, sắp xếp và lưu cấu hình ma trận */
    UPDATE: "SETTINGS_UPDATE",
    /** Quyền xóa phân hệ và gỡ action */
    DELETE: "SETTINGS_DELETE",
  },
  CLIENT: {
    /** Học viên: vào màn hình & hiện menu */
    VIEW: "CLIENT_VIEW",
    READ: "CLIENT_READ",
    CREATE: "CLIENT_CREATE",
    UPDATE: "CLIENT_UPDATE",
    DELETE: "CLIENT_DELETE",
    EXPORT: "CLIENT_EXPORT",
    IMPORT: "CLIENT_IMPORT",
  },
  SEASON: {
    /** Mùa giải: vào màn hình & hiện menu */
    VIEW: "SEASON_VIEW",
    READ: "SEASON_READ",
    CREATE: "SEASON_CREATE",
    UPDATE: "SEASON_UPDATE",
    DELETE: "SEASON_DELETE",
    EXPORT: "SEASON_EXPORT",
    IMPORT: "SEASON_IMPORT",
  },
  WORKOUT_PROGRAM: {
    /** Giáo án tập: vào màn hình & hiện menu */
    VIEW: "WORKOUT_PROGRAM_VIEW",
    READ: "WORKOUT_PROGRAM_READ",
    CREATE: "WORKOUT_PROGRAM_CREATE",
    UPDATE: "WORKOUT_PROGRAM_UPDATE",
    DELETE: "WORKOUT_PROGRAM_DELETE",
    EXPORT: "WORKOUT_PROGRAM_EXPORT",
    IMPORT: "WORKOUT_PROGRAM_IMPORT",
  },
  DAILY_LOG: {
    /** Nhật ký hằng ngày: vào màn hình & hiện menu */
    VIEW: "DAILY_LOG_VIEW",
    READ: "DAILY_LOG_READ",
    CREATE: "DAILY_LOG_CREATE",
    UPDATE: "DAILY_LOG_UPDATE",
    DELETE: "DAILY_LOG_DELETE",
    EXPORT: "DAILY_LOG_EXPORT",
    IMPORT: "DAILY_LOG_IMPORT",
  },
  EXERCISE: {
    /** Bài tập: vào màn hình & hiện menu */
    VIEW: "EXERCISE_VIEW",
    READ: "EXERCISE_READ",
    CREATE: "EXERCISE_CREATE",
    UPDATE: "EXERCISE_UPDATE",
    DELETE: "EXERCISE_DELETE",
    EXPORT: "EXERCISE_EXPORT",
    IMPORT: "EXERCISE_IMPORT",
  },
  FOOD_ITEM: {
    /** Thực phẩm: vào màn hình & hiện menu */
    VIEW: "FOOD_ITEM_VIEW",
    READ: "FOOD_ITEM_READ",
    CREATE: "FOOD_ITEM_CREATE",
    UPDATE: "FOOD_ITEM_UPDATE",
    DELETE: "FOOD_ITEM_DELETE",
    EXPORT: "FOOD_ITEM_EXPORT",
    IMPORT: "FOOD_ITEM_IMPORT",
  },
  FOOD_CATEGORY: {
    /** Nhóm thực phẩm: vào màn hình & hiện menu */
    VIEW: "FOOD_CATEGORY_VIEW",
    READ: "FOOD_CATEGORY_READ",
    CREATE: "FOOD_CATEGORY_CREATE",
    UPDATE: "FOOD_CATEGORY_UPDATE",
    DELETE: "FOOD_CATEGORY_DELETE",
    EXPORT: "FOOD_CATEGORY_EXPORT",
    IMPORT: "FOOD_CATEGORY_IMPORT",
  },
  AI_COACH: {
    /** Trợ lý AI: vào màn hình & hiện menu */
    VIEW: "AI_COACH_VIEW",
    /** Gửi câu hỏi / nhận gợi ý từ trợ lý AI */
    READ: "AI_COACH_READ",
  },
  // [gen:module] Module sinh bởi `npm run gen:module` được chèn phía trên dòng này
} as const;

type ValueOf<T> = T[keyof T];

/**
 * Union Type đại diện cho tất cả các mã quyền hợp lệ trong hệ thống (tự suy ra từ PERMISSIONS).
 */
export type PermissionCode = {
  [M in keyof typeof PERMISSIONS]: ValueOf<(typeof PERMISSIONS)[M]>;
}[keyof typeof PERMISSIONS];
