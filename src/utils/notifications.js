export const showToast = (message, type = "success") => {
  window.dispatchEvent(new CustomEvent("sahm-toast", { detail: { message, type } }));
};
