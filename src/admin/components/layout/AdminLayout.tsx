import AdminLayoutNexus from "./AdminLayoutNexus.tsx";

/**
 * Compat wrapper to keep existing pages working while plugins system is refactored.
 * Delegates to AdminLayoutNexus.
 */
export const AdminLayout = (props: any) => {
  return AdminLayoutNexus(props);
};

export default AdminLayout;
