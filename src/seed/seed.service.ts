import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { PokeResponse } from './interfaces/poke-response.interface';


@Injectable()
export class SeedService {

  private readonly axios: AxiosInstance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

  async executeSeed() {
    try {

      // Ahora usamos la instancia configurada
      const { data } = await this.axios.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=1');
      data.results.forEach(({name , url}) => {
        const id = url.split('/').filter(Boolean).pop(); // Extraemos el ID del URL
        console.log({id, name});
      });

    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error al ejecutar el seed');
    } 
  }

  
}
