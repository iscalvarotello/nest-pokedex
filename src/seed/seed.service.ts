import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PokeResponse } from './interfaces/poke-response.interface';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {

  constructor(
     @InjectModel(Pokemon.name)
        private readonly pokemonModel: Model<Pokemon> ,
        private readonly http:AxiosAdapter ,
  ) {}

  

  async executeSeed() {
    await this.pokemonModel.deleteMany({}).exec(); // Eliminar todos los documentos existentes en la colección
    const pokemonToInsert: {name: string, no: number}[] = [];   
    try {
      const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');
      data.results.forEach( ({name , url}) => {
        const id = Number(url.split('/').filter(Boolean).pop()); // Extraemos el ID del URL
        if ( !isNaN(id) && id > 0 && id !== undefined ) {     
          pokemonToInsert.push({ name, no: id });
        }
      });
      await this.pokemonModel.insertMany(pokemonToInsert);
      return 'Seed ejecutado correctamente';
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error al ejecutar el seed');
    } 
  }

  // FORMA 1 DE HACERLO, PERO NO RECOMENDADA PORQUE PIERDE LA CAPACIDAD DE CONTROLAR LOS ERRORES DE MANERA EFICIENTE
  // async executeSeed() {

  //   await this.pokemonModel.deleteMany({}).exec(); // Eliminar todos los documentos existentes en la colección

  //   let model = new CreatePokemonDto ();

  //   const insertPromises: Promise<any>[] = [];
    
  //   try {

  //     // Ahora usamos la instancia configurada
  //     const { data } = await this.axios.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=200');
  //     data.results.forEach( ({name , url}) => {
  //       const id = Number(url.split('/').filter(Boolean).pop()); // Extraemos el ID del URL
  //       if ( !isNaN(id) && id > 0 && id !== undefined ) {
  //         model.name = name;
  //         model.no = id;
  //         insertPromises.push(this.pokemonModel.create(model));
  //       }
  //     });
  //     await Promise.all(insertPromises);
  //     return 'Seed ejecutado correctamente';
  //   } catch (error) {
  //     console.log(error);
  //     throw new InternalServerErrorException('Error al ejecutar el seed');
  //   } 
  // }

  
}
