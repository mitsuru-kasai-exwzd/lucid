/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { LucidRow, LucidModel } from '@ioc:Adonis/Lucid/Model'
import { ExtractModelRelations, RelationshipsContract } from '@ioc:Adonis/Lucid/Relations'

import {
  NewUpModelFunction,
  ModelStateCallback,
  FactoryModelContract,
  FactoryRelationContract,
} from '@ioc:Adonis/Lucid/Factory'

import { HasOne } from './Relations/HasOne'
import { HasMany } from './Relations/HasMany'
import { BelongsTo } from './Relations/BelongsTo'
import { ManyToMany } from './Relations/ManyToMany'

import { FactoryBuilder } from './FactoryBuilder'

/**
 * Factory model exposes the API to define a model factory with custom
 * states and relationships
 */
export class FactoryModel implements FactoryModelContract<LucidModel, any> {
  /**
   * A collection of factory states
   */
  public states: { [key: string]: ModelStateCallback<LucidRow> } = {}

  /**
   * A collection of factory relations
   */
  public relations: { [relation: string]: FactoryRelationContract } = {}

  constructor (
    public model: LucidModel,
    public newUp: NewUpModelFunction<LucidModel, any>,
  ) {
  }

  /**
   * Returns state callback defined on the model factory. Raises an
   * exception, when state is not registered
   */
  public getState (state: string): ModelStateCallback<LucidRow> {
    const stateCallback = this.states[state]
    if (!stateCallback) {
      throw new Error(`Cannot apply undefined state "${state}". Double check the model factory`)
    }

    return stateCallback
  }

  /**
   * Returns the pre-registered relationship factory function, along with
   * the original model relation.
   */
  public getRelation (relation: string): FactoryRelationContract {
    const relationship = this.relations[relation]
    if (!relationship) {
      throw new Error(`Cannot setup undefined relationship "${relation}". Double check the model factory`)
    }

    return relationship
  }

  /**
   * Define custom state for the factory. When executing the factory,
   * you can apply the pre-defined states
   */
  public state (state: string, callback: ModelStateCallback<LucidRow>): any {
    this.states[state] = callback
    return this
  }

  /**
   * Define a relationship on another factory
   */
  public related<K extends ExtractModelRelations<LucidRow>> (
    relation: K,
    callback: any,
  ): any {
    const modelRelation = this.model.$getRelation(relation) as RelationshipsContract

    if (!modelRelation) {
      throw new Error([
        `Cannot define "${relation}" relationship.`,
        `The relationship must exist on the "${this.model.name}" model first`,
      ].join(' '))
    }

    switch (modelRelation.type) {
      case 'belongsTo':
        this.relations[relation as unknown as string] = new BelongsTo(modelRelation, callback)
        break
      case 'hasOne':
        this.relations[relation as unknown as string] = new HasOne(modelRelation, callback)
        break
      case 'hasMany':
        this.relations[relation as unknown as string] = new HasMany(modelRelation, callback)
        break
      case 'manyToMany':
        this.relations[relation as unknown as string] = new ManyToMany(modelRelation, callback)
        break
    }

    return this
  }

  /**
   * Build factory model and return factory builder. The builder is then
   * used to make/create model instances
   */
  public build () {
    return new FactoryBuilder(this)
  }
}
