import axios from 'axios';

const client = axios.create({
  baseURL: '/',
  withCredentials: false,
  validateStatus: () => true,
  transformResponse: [(data) => data]
});

const normalizeHeaders = (headers = {}) => {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  return { ...headers };
};

const createHeadersAdapter = (headers = {}) => {
  const lowerCaseHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), value])
  );

  return {
    get(name) {
      return lowerCaseHeaders[String(name).toLowerCase()] ?? null;
    }
  };
};

export async function request(url, options = {}) {
  const method = options.method || 'GET';
  const headers = normalizeHeaders(options.headers);
  const response = await client.request({
    url,
    method,
    headers,
    data: options.body,
    responseType: 'text'
  });

  const textBody = typeof response.data === 'string'
    ? response.data
    : response.data == null
      ? ''
      : JSON.stringify(response.data);

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    url,
    headers: createHeadersAdapter(response.headers),
    async json() {
      return textBody ? JSON.parse(textBody) : null;
    },
    async text() {
      return textBody;
    }
  };
}

export default client;
