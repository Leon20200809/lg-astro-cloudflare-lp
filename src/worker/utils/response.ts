export const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
): Response => {
  return Response.json(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
