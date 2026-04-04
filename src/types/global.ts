export type PageProps = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};
