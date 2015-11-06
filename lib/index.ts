import {Http, RequestOptions, Request, RequestMethods, Response, ResponseOptions, Headers, HTTP_PROVIDERS} from 'angular2/http';
import {Injectable, Inject} from 'angular2/angular2';

export class ApiResponse {
    status: number;
    ok: boolean;
    url: string;
    statusText: string;
    headers: Headers;
    data: any;

    constructor(response: Response) {
        this.status = response.status;
        this.ok = (response.status >= 200 && response.status < 300);
        this.url = response.url;
        this.statusText = response.statusText;
        this.headers = response.headers;
        this.data = response.json();
    }
}

@Injectable()
export class ApiRequestInterceptor {
    beforeRequest(options: RequestOptions): Promise<RequestOptions> {
        return new Promise(resolve => resolve(options));
    }

    beforeRequestError(error: any): Promise<RequestOptions> {
        return new Promise((resolve, reject) => reject(error));
    }

    afterRequest(response: ApiResponse): Promise<ApiResponse> {
        return new Promise(resolve => resolve(response));
    }

    afterRequestError(response: ApiResponse): Promise<ApiResponse> {
        return new Promise((resolve, reject) => reject(response));
    }
}

@Injectable()
class RawApiRequest {
    constructor(private http: Http) { }

    request(options: RequestOptions) {
        return new Promise<any>((resolve, reject) => {
            this.http.request(new Request(options))
                .map((res: Response) => new ApiResponse(Object.assign(res, { url: options.url })))
                .subscribe(
                (res: ApiResponse) => {
                    if (res.ok) {
                        resolve(res);
                    }
                    else {
                        reject(res);
                    }
                },
                (error: any) => {
                    reject(error);
                }
                );
        });
    }
}

@Injectable()
export class ApiRequest {
    constructor(
        private req: RawApiRequest,
        private interceptor: ApiRequestInterceptor
    ) {
        this.interceptor = interceptor;
    }

    private request(requestOptions: RequestOptions): Promise<ApiResponse> {
        let result: Promise<ApiResponse> =
            this.interceptor.beforeRequest(requestOptions)
                .then((finalOptions: RequestOptions) =>

                    this.req.request(finalOptions)
                        .then((response: ApiResponse) =>

                            this.interceptor.afterRequest(response)
                                .catch((error) => this.interceptor.afterRequestError(error))

                        )
                )
                .catch((error) => this.interceptor.beforeRequestError(error));

        return result;
    }

    get(url: string, search: string = '', options: any = {}): Promise<ApiResponse> {
        return this.request(new RequestOptions({
            method: RequestMethods.Get,
            url: url,
            search: search,
            headers: options.headers
        }));
    }

    post(url: string, body: any = {}, options: any = {}): Promise<ApiResponse> {
        return this.request(new RequestOptions({
            method: RequestMethods.Post,
            url: url,
            body: JSON.stringify(body),
            headers: options.headers,
            search: options.search
        }));
    }
}

export const API_REQUEST_PROVIDERS = [
    ApiRequest,
    ApiRequestInterceptor,
    HTTP_PROVIDERS,
    RawApiRequest
];