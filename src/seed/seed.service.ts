import { name } from './../../node_modules/ci-info/index.d';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { PokeResponse } from './interfaces/poke-response.interface';
import { PokemonService } from 'src/pokemon/pokemon.service';
import { CreatePokemonDto } from 'src/pokemon/dto/create-pokemon.dto';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';


@Injectable()
export class SeedService {

  constructor(
     @InjectModel(Pokemon.name)
        private readonly pokemonModel: Model<Pokemon>
  ) {}

  private readonly axios: AxiosInstance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

  async executeSeed() {

    await this.pokemonModel.deleteMany({}).exec(); // Eliminar todos los documentos existentes en la colección

    let model = new CreatePokemonDto ();

    const pokemonToInsert: {name: string, no: number}[] = [];
    
    try {

      // Ahora usamos la instancia configurada
      const { data } = await this.axios.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');
      data.results.forEach( ({name , url}) => {
        const id = Number(url.split('/').filter(Boolean).pop()); // Extraemos el ID del URL
        if ( !isNaN(id) && id > 0 && id !== undefined ) {
          model.name = name;
          model.no = id;
          pokemonToInsert.push({ name, no: id });
        }
      });

      await this.pokemonModel.insertMany(pokemonToInsert);
      // Alternativamente, si quieres usar create para cada uno (aunque es menos eficiente):
      // for (const { name, no } of pokemonToInsert) {
      //   await this.pokemonModel.create({ name, no });
      // }
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
