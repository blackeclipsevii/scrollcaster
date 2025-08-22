
let endpoint: null | string = null;
export const getEndpoint = (): string => {
    if (endpoint)
        return endpoint;

    const params = new URLSearchParams(window.location.search);
    let hostname = "https://army-thing.fly.dev";
    let port = null;
    if (params.get('localdev')) {
        hostname = 'http://localhost';
        port = 3000;
    }
    endpoint = port ? `${hostname}:${port}` : hostname;
    return endpoint;
}
