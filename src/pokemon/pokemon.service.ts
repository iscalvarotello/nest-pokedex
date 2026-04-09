import { Injectable                   } from '@nestjs/common'   ;
import { BadRequestException          } from '@nestjs/common'   ;
import { InternalServerErrorException } from '@nestjs/common'   ;
import { NotFoundException            } from '@nestjs/common'   ;

import { ConfigService                } from '@nestjs/config'   ;

import { InjectModel                  } from '@nestjs/mongoose' ;
import { Model                        } from 'mongoose'         ;
import { isValidObjectId              } from 'mongoose'         ;

import { CreatePokemonDto             } from './dto/create-pokemon.dto'      ;
import { UpdatePokemonDto             } from './dto/update-pokemon.dto'      ;
import { PaginationDto                } from 'src/common/dto/pagination.dto' ;

import { Pokemon                      } from './entities/pokemon.entity'     ;

@Injectable()
export class PokemonService {

  private defaultLimit:number = 5 ;

  constructor(

    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon> ,

    private readonly configService: ConfigService ,
  ) {
    this.defaultLimit = configService.get<number>( 'defaultLimit' ) || 5;
    console.log ( `defaultLimit: ${this.defaultLimit}` )
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll( pagination : PaginationDto ) {

    const { limit = this.defaultLimit , offset = 0 } = pagination ;

    return await this.pokemonModel.find()
    .limit  ( limit    )  
    .skip   ( offset   )
    .sort   ( { no: 1} ) // Ordenado ascendente
    .select ( '-__v'   ) ;  
  }

  async findOne(term: string) {
    let pokemon: Pokemon | null  = null;
    
    let isNumber = !isNaN(+term);
    let isMongoId = isValidObjectId(term);
    let isName = typeof term === 'string' && term.trim().length > 0;

    let kind = isNumber ? 'No. ' : isMongoId ? 'id: ' : 'name: ';

    if (isNumber && !isMongoId ) {
      pokemon = await this.pokemonModel.findOne({ no: +term });
    } 
    
    if (pokemon == null && isMongoId) { 
      pokemon = await this.pokemonModel.findById(term);
    } 
    
    if (isName && pokemon == null) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() });
    }

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with ${kind}${term} not found`);
    }
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
      const pokemon = await this.findOne(term);
      if (updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
      
      try {
        await pokemon.updateOne(updatePokemonDto, { new: true });
        return pokemon;
      } catch (error) { this.handleExceptions(error) ;  }
  }

  async remove(id: string) {
     const result = await this.pokemonModel.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Pokemon with id: ${id} not found or already deleted.`);
      }
      return `The pokemon with ID ${id} has been successfully deleted.`;
      
      // const pokemon = await this.findOne(id);
      // if (pokemon) {
      //   await pokemon.deleteOne();
      //   return `The pokemon with ID ${id} has been successfully deleted.` ;
      // }
      // return `The pokemon with ID ${id} was either not found or has already been deleted.`;
  }

  private handleExceptions(error: any) {
    console.log(error);
    if (error instanceof Object && 'code' in error && error.code === 11000) {
      throw new BadRequestException(`Pokemon with name ${error.keyValue.name} or No.${error.keyValue.no} already exists`);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new InternalServerErrorException(`An error occurred while processing the pokemon. ${errorMessage}`);
  }
}
