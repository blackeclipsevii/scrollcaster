import RosterInterf from "../../shared-lib/RosterInterface.js";
import UnitInterf from "../../shared-lib/UnitInterface.js";
import { Settings } from "./widgets/header.js";

export const DYNAMIC_WARSCROLL = false;

export interface Page {
  loadPage: ((settings:Settings) => unknown);
}

export var dynamicPages: {[name: string]: Page} = {};

export let _inCatalog = localStorage.getItem('inCatalog') ? localStorage.getItem('inCatalog') === 'true' : false;

export const setInCatalog = (value: boolean) => {
  _inCatalog = value
}

export function unitTotalPoints(unit: UnitInterf) {
  if (!unit || !unit.points)
      return 0;

  let pts = unit.points;
  
  if (unit.isReinforced)
      pts += unit.points;

  if (unit.enhancements) {
    const enhancements = Object.values(unit.enhancements);
    enhancements.forEach(enhance => {
      if (enhance.slot) {
        pts += enhance.slot.points;
      }
    });
  }

  return pts;
}

export const rosterTotalPoints = (roster: RosterInterf) => {
  let total = 0;
  roster.regiments.forEach(reg => {
    if (reg.leader) {
      total += unitTotalPoints(reg.leader);
    }
    reg.units.forEach(unit => {
      total += unitTotalPoints(unit);
    });
  });

  roster.auxiliaryUnits.forEach(unit => {
    total += unitTotalPoints(unit);
  });

  const lores = Object.values(roster.lores);
  lores.forEach(lore => {
    if (lore && lore.points) {
      total += lore.points;
    }
  });

  if (roster.terrainFeature && roster.terrainFeature.points) {
    total += roster.terrainFeature.points;
  }
  
  return total;
}

export const displayPoints = (pointsElement: HTMLElement, points: number, pts='pts') => {
    if (points > 0) {
        pointsElement.textContent = `${points} ${pts}`;
    } else {
        pointsElement.style.display = 'none';
        pointsElement.textContent = '';
    }
}
