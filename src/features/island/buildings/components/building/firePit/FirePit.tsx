import React, { useContext, useState } from "react";

import firePit from "assets/buildings/fire_pit.png";
import npc from "assets/npcs/cook.gif";
import doing from "assets/npcs/cook_doing.gif";
import shadow from "assets/npcs/shadow.png";

import classNames from "classnames";
import { FirePitModal } from "./FirePitModal";
import { ConsumableName } from "features/game/types/consumables";
import { ITEM_DETAILS } from "features/game/types/images";
import { ToastContext } from "features/game/toast/ToastQueueProvider";
import { CraftingMachineChildProps } from "../WithCraftingMachine";
import { BuildingProps } from "../Building";
import { InventoryItemName } from "features/game/types/game";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { BuildingImageWrapper } from "../BuildingImageWrapper";

type Props = BuildingProps & Partial<CraftingMachineChildProps>;

export const FirePit: React.FC<Props> = ({
  buildingId,
  crafting,
  idle,
  ready,
  name,
  craftingService,
  isBuilt,
  handleShowCraftingTimer,
  onRemove,
}) => {
  const [showModal, setShowModal] = useState(false);
  const { setToast } = useContext(ToastContext);

  if (!craftingService || !handleShowCraftingTimer) {
    return null;
  }

  const handleCook = (item: ConsumableName) => {
    craftingService.send({
      type: "CRAFT",
      event: "recipe.cooked",
      item,
      buildingId,
    });
  };

  const handleCollect = () => {
    const { name } = craftingService.state.context;

    if (!name) return;

    craftingService.send({
      type: "COLLECT",
      item: name,
      event: "recipe.collected",
    });

    setToast({
      icon: ITEM_DETAILS[name as InventoryItemName].image,
      content: "+1",
    });
  };

  const handleClick = () => {
    if (onRemove) {
      onRemove();
      return;
    }

    if (isBuilt) {
      // Add future on click actions here
      if (idle) {
        setShowModal(true);
        return;
      }

      if (crafting) {
        handleShowCraftingTimer();
        return;
      }

      if (ready) {
        handleCollect();
        return;
      }
    }
  };

  return (
    <>
      <BuildingImageWrapper onClick={handleClick}>
        <img
          src={firePit}
          className={classNames("absolute bottom-0", {
            "opacity-100": !crafting,
            "opacity-80": crafting,
          })}
          style={{
            width: `${PIXEL_SCALE * 47}px`,
            height: `${PIXEL_SCALE * 33}px`,
          }}
        />
        {ready && name && (
          <img
            src={ITEM_DETAILS[name].image}
            className="absolute z-30 img-highlight-heavy"
            style={{
              // TODO - dynamically get correct width
              width: `${PIXEL_SCALE * 12}px`,
              top: `${PIXEL_SCALE * 16}px`,
              left: `${PIXEL_SCALE * 17}px`,
            }}
          />
        )}
        {crafting && name && (
          <img
            src={ITEM_DETAILS[name].image}
            className="absolute z-30"
            style={{
              // TODO - dynamically get correct width
              width: `${PIXEL_SCALE * 12}px`,
              top: `${PIXEL_SCALE * 16}px`,
              left: `${PIXEL_SCALE * 17}px`,
            }}
          />
        )}
        <img
          src={shadow}
          className="absolute"
          style={{
            width: `${PIXEL_SCALE * 15}px`,
            top: `${PIXEL_SCALE * 14}px`,
            left: `${PIXEL_SCALE * 13}px`,
          }}
        />
        {crafting ? (
          <img
            src={doing}
            className="absolute"
            style={{
              width: `${PIXEL_SCALE * 16}px`,
              top: `${PIXEL_SCALE * 2}px`,

              left: `${PIXEL_SCALE * 13}px`,
            }}
          />
        ) : (
          <img
            src={npc}
            className="absolute"
            style={{
              width: `${PIXEL_SCALE * 14}px`,
              top: `${PIXEL_SCALE * 2}px`,
              left: `${PIXEL_SCALE * 13}px`,
            }}
          />
        )}
      </BuildingImageWrapper>

      <FirePitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCook={handleCook}
      />
    </>
  );
};
