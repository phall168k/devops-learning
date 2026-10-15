import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public async create(dto: CreateUserRequestDto): Promise<UserResponseDto> {
    try {
      let entity = UserMapper.toCreateEntity(dto);
      entity = await this.userRepository.save(entity);
      return UserMapper.toDto(entity);
    } catch (error) {
      throw error;
    }
  }

  public async findAll(): Promise<UserResponseDto[]> {
    try {
        const entities = await this.userRepository.find();
        const items = Promise.all(
          entities.map((item) => UserMapper.toDto(item)),
        );
        return items;
    } catch (error) {
      throw error;
    }
  }

  public async findOne(id: number): Promise<UserResponseDto> {

    try {
      const entity = await this.userRepository.findOneBy({ id });
      if (!entity) throw new NotFoundException('User not found');
      return UserMapper.toDto(entity);
    } catch (error) {
      throw error;
    }

  }

  public async update(id: number, dto: UpdateUserRequestDto): Promise<UserResponseDto> {
    let entity = await this.userRepository.findOneBy({ id });
    if (!entity) throw new NotFoundException('User not found');
    entity = UserMapper.toUpdateEntity(entity, dto);
    entity = await this.userRepository.save(entity);
    return UserMapper.toDto(entity);   
  }

  public async remove(id: number): Promise<void> {
    try {
      const entity = await this.userRepository.findOneBy({ id });
      if (!entity) throw new NotFoundException('User not found');
      await this.userRepository.softDelete(id);
    } catch (error) {
      throw error;
    }
  }
}
