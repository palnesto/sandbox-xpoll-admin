// Sandbox-only: image uploads (hooks/upload/useAssetUpload.ts) call raw `fetch()`
// directly against VITE_BACKEND_URL — presign, then POST the file to that presigned
// URL, then "make-public" — bypassing the axios instance (and therefore mock-api.ts)
// entirely. Patching window.fetch here is the only way to intercept that flow so
// "Add Image" resolves to a real-looking picture instead of hanging on a dead backend.
import genericUpload from "@/assets/bc.png";

const UPLOAD_HOST = "https://sandbox-uploads.local.com/";
const realFetch = window.fetch.bind(window);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (url.includes("/utils/signed-url")) {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const fileName = body?.file?.fileName || `upload-${Date.now()}`;
    return jsonResponse({
      signedUrl: UPLOAD_HOST,
      fields: { key: fileName },
      fileName,
      publicUrl: genericUpload,
    });
  }

  if (url.startsWith(UPLOAD_HOST)) {
    return new Response(null, { status: 204 });
  }

  if (url.includes("/utils/make-public")) {
    return jsonResponse({ success: true });
  }

  return realFetch(input, init);
};
