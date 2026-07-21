// Market-selected engine. The US engine is the default (and the only one the
// touchscreen build ever uses); the UKI engine is picked by VITE_MARKET=uki.
import { UKI } from '../market';
import { calc as calcUS } from './engine';
import { calc as calcUKI } from './engine.uki';
export const calc = UKI ? calcUKI : calcUS;
