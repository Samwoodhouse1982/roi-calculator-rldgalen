// Market-selected vendor catalogue.
import { UKI } from '../market';
import * as us from './vendors';
import * as uki from './vendors.uki';
export const KNOWN_SYSTEMS = UKI ? uki.KNOWN_SYSTEMS : us.KNOWN_SYSTEMS;
export const TIER_TYPES = UKI ? uki.TIER_TYPES : us.TIER_TYPES;
export const systemCost = UKI ? uki.systemCost : us.systemCost;
