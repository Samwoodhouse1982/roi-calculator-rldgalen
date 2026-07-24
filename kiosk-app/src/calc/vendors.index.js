// Market-selected vendor catalogue.
import { UKI, AU } from '../market';
import * as us from './vendors';
import * as uki from './vendors.uki';
import * as au from './vendors.au';
export const KNOWN_SYSTEMS = UKI ? uki.KNOWN_SYSTEMS : AU ? au.KNOWN_SYSTEMS : us.KNOWN_SYSTEMS;
export const TIER_TYPES = UKI ? uki.TIER_TYPES : AU ? au.TIER_TYPES : us.TIER_TYPES;
export const systemCost = UKI ? uki.systemCost : AU ? au.systemCost : us.systemCost;
// AU-only: sector-keyed catalogues for the sector-aware Systems step.
export const KNOWN_SYSTEMS_BY_SECTOR = AU ? au.KNOWN_SYSTEMS_BY_SECTOR : null;
export const TIER_TYPES_BY_SECTOR = AU ? au.TIER_TYPES_BY_SECTOR : null;
