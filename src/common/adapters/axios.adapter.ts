import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { HttpAdapter } from '../interfaces/http-adapter.interface';


@Injectable()
export class AxiosAdapter implements HttpAdapter {
    
    private readonly axios: AxiosInstance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

    
  async get<T>(url: string): Promise<T> {
    try {  
        const { data } =  await this.axios.get<T>(url);
        return data;
    } catch (error) {
        console.error(`Error en GET ${url}`, error);
        throw new Error(`Error en GET ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
