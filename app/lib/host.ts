
import RosterInterf from "@/shared-lib/RosterInterface";
import UnitInterf from "@/shared-lib/UnitInterface";

export const isDOMAvailable = () => {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function'
  );
}

export const DYNAMIC_WARSCROLL = false;

export function unitTotalPoints(unit: UnitInterf) {
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

  if (roster.regimentOfRenown) {
    total += roster.regimentOfRenown.points;
  }

  return total;
}

export const displayPoints = (pointsElement: HTMLElement, points: number, pts='pts', force?: boolean) => {
    if (force || points > 0) {
        pointsElement.textContent = `${points} ${pts}`;
    } else {
        pointsElement.style.display = 'none';
        pointsElement.textContent = '';
    }
}
