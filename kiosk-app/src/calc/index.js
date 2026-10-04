// Market-selected engine. The US engine is the default; UKI and AU engines
// are picked by VITE_MARKET (UKI runs on both the touchscreen and the embed).
import { UKI, AU } from '../market';
import { calc as calcUS } from './engine';
import { calc as calcUKI } from './engine.uki';
import { calc as calcAU } from './engine.au';
export const calc = UKI ? calcUKI : AU ? calcAU : calcUS;
