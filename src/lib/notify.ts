export const notify = {
  success(message: string) {
    void import("sonner").then(({ toast }) => toast.success(message));
  },
  error(message: string) {
    void import("sonner").then(({ toast }) => toast.error(message));
  },
  info(message: string) {
    void import("sonner").then(({ toast }) => toast.info(message));
  },
};
