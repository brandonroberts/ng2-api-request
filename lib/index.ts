import {Http, RequestOptions, Request, RequestMethods, Response, Headers} from 'angular2/http';
import {Injectable, Inject} from 'angular2/core';

export class ApiResponse{
	status: number;
	ok: boolean;
	url: string;
	statusText: string;
	headers: Headers;
	data: any;
	
	constructor(response: Response){
		this.status = response.status;
		this.ok = response.ok;
		this.url = response.url;
		this.statusText = response.statusText;
		this.headers = response.headers;
		this.data = response.json();
	}
}

@Injectable()
export class ApiRequestInterceptor{
	beforeRequest(options: RequestOptions): Promise<RequestOptions>{
		return new Promise(resolve => resolve(options));
	}
	
	beforeRequestError(error: any): Promise<RequestOptions>{
		return new Promise((resolve, reject) => reject(error));
	}
	
	afterRequest(response: ApiResponse): Promise<ApiResponse>{
		return new Promise(resolve => resolve(response));
	}
	
	afterRequestError(response: ApiResponse): Promise<ApiResponse>{
		return new Promise((resolve, reject) => reject(response));
	}
}

@Injectable()
export class RawApiRequest{
	constructor(private http: Http, private methods: RequestMethods){ }
	
	request(options: RequestOptions){
		return new Promise<any>((resolve, reject) => {			
			this.http.request(new Request(options))
				.map((res: Response) => new ApiResponse(res))
				.subscribe(
					(res: ApiResponse) => {
						if(res.ok){
							resolve(res);
						}
						else{
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
export class ApiRequest{	
	constructor(
		private req: RawApiRequest, 
		private interceptor: ApiRequestInterceptor
	){ 
		this.interceptor = interceptor;		
	}
	
	private async request(requestOptions: RequestOptions): Promise<ApiResponse>{
		let finalOptions: RequestOptions;
		
		try{
			finalOptions = await this.interceptor.beforeRequest(requestOptions);
		}
		catch(e){
			finalOptions = await this.interceptor.beforeRequestError(e);
		}
		
		let result: ApiResponse;
		
		try{
			let firstResult: ApiResponse = await this.req.request(finalOptions);
			result = await this.interceptor.afterRequest(firstResult);
		}
		catch(e){
			result = await this.interceptor.afterRequestError(e);
		}
		
		return result;
	}
	
	get(url: string, search: any, options: { headers: Headers }): Promise<ApiResponse>{
		return this.request(new RequestOptions({
			method: RequestMethods.Get,
			url: url,
			search: search,
			headers: options.headers
		}));
	}
	
	post(url: string, body: any, options: { headers: Headers, search: any }): Promise<ApiResponse>{
		return this.request(new RequestOptions({
			method: RequestMethods.Post,
			url: url,
			body: JSON.stringify(body),
			headers: options.headers,
			search: options.search
		}));
	}
}