import React, { useContext, useEffect, useRef, useState } from "react";

import Spritesheet, {
  SpriteSheetInstance,
} from "components/animation/SpriteAnimator";

import Decimal from "decimal.js-light";

import shakeSheet from "assets/resources/tree/shake_sheet.png";
import choppedSheet from "assets/resources/tree/chopped_sheet.png";
import stump from "assets/resources/tree/stump.png";
import wood from "assets/resources/wood.png";
import axe from "assets/tools/axe.png";

import {
  GRID_WIDTH_PX,
  POPOVER_TIME_MS,
  TREE_RECOVERY_TIME,
} from "features/game/lib/constants";
import { Context } from "features/game/GameProvider";
import { ToastContext } from "features/game/toast/ToastQueueProvider";
import classNames from "classnames";
import { useActor } from "@xstate/react";
import {
  canChop,
  CHOP_ERRORS,
  getRequiredAxeAmount,
} from "features/game/events/chop";

import { getTimeLeft } from "lib/utils/time";
import { Bar, ProgressBar } from "components/ui/ProgressBar";
import { chopAudio, treeFallAudio } from "lib/utils/sfx";
import { TimeLeftPanel } from "components/ui/TimeLeftPanel";
import useUiRefresher from "lib/utils/hooks/useUiRefresher";
import { InnerPanel } from "components/ui/Panel";

const HITS = 3;
const tool = "Axe";

interface Props {
  treeIndex: number;
}

export const Tree: React.FC<Props> = ({ treeIndex }) => {
  const { gameService, selectedItem } = useContext(Context);
  const [game] = useActor(gameService);

  const [showPopover, setShowPopover] = useState(true);
  const [showLabel, setShowLabel] = useState(false);
  const [popover, setPopover] = useState<JSX.Element | null>();

  const [touchCount, setTouchCount] = useState(0);
  // When to hide the wood that pops out
  const [collecting, setCollecting] = useState(false);

  const treeRef = useRef<HTMLDivElement>(null);
  const shakeGif = useRef<SpriteSheetInstance>();
  const choppedGif = useRef<SpriteSheetInstance>();

  const [showStumpTimeLeft, setShowStumpTimeLeft] = useState(false);

  const { setToast } = useContext(ToastContext);

  // Reset the shake count when clicking outside of the component
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (treeRef.current && !treeRef.current.contains(event.target)) {
        setTouchCount(0);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  const tree = game.context.state.trees[treeIndex];

  const chopped = !canChop(tree);

  useUiRefresher({ active: chopped });

  const displayPopover = async (element: JSX.Element) => {
    setPopover(element);
    setShowPopover(true);

    await new Promise((resolve) => setTimeout(resolve, POPOVER_TIME_MS));
    setShowPopover(false);
  };

  // Show/Hide Time left on hover

  const handleMouseHoverStump = () => {
    setShowStumpTimeLeft(true);
  };

  const handleMouseLeaveStump = () => {
    setShowStumpTimeLeft(false);
  };

  const axesNeeded = getRequiredAxeAmount(game.context.state.inventory);
  const axeAmount = game.context.state.inventory.Axe || new Decimal(0);

  // Has enough axes to chop the tree
  const hasAxes =
    (selectedItem === "Axe" || axesNeeded.eq(0)) && axeAmount.gte(axesNeeded);

  const shake = async () => {
    if (!hasAxes) {
      return;
    }

    const isPlaying = shakeGif.current?.getInfo("isPlaying");

    if (isPlaying) {
      return;
    }

    chopAudio.play();
    shakeGif.current?.goToAndPlay(0);

    setTouchCount((count) => count + 1);

    // On third shake, chop
    if (touchCount > 0 && touchCount === HITS - 1) {
      chop();
      treeFallAudio.play();
      setTouchCount(0);
    }
  };

  const chop = async () => {
    setTouchCount(0);

    try {
      gameService.send("tree.chopped", {
        index: treeIndex,
        item: selectedItem,
      });
      setCollecting(true);
      choppedGif.current?.goToAndPlay(0);

      displayPopover(
        <div className="flex">
          <img src={wood} className="w-5 h-5 mr-2" />
          <span className="text-sm text-white text-shadow">{`+${tree.wood}`}</span>
        </div>
      );

      setToast({
        icon: wood,
        content: `+${tree.wood}`,
      });

      await new Promise((res) => setTimeout(res, 2000));
      setCollecting(false);
    } catch (e: any) {
      if (e.message === CHOP_ERRORS.NO_AXES) {
        displayPopover(
          <div className="flex">
            <img src={axe} className="w-4 h-4 mr-2" />
            <span className="text-xs text-white text-shadow">No axes left</span>
          </div>
        );
        return;
      }

      displayPopover(
        <span className="text-xs text-white text-shadow">{e.message}</span>
      );
    }
  };

  const handleHover = () => {
    if (hasAxes) return;

    treeRef.current?.classList["add"]("cursor-not-allowed");
    setShowLabel(true);
  };

  const handleMouseLeave = () => {
    if (hasAxes) return;

    treeRef.current?.classList["remove"]("cursor-not-allowed");
    setShowLabel(false);
  };

  const timeLeft = getTimeLeft(tree.choppedAt, TREE_RECOVERY_TIME);
  const percentage = 100 - (timeLeft / TREE_RECOVERY_TIME) * 100;

  return (
    <div className="relative" style={{ height: "106px" }}>
      {!chopped && (
        <div
          onMouseEnter={handleHover}
          onMouseLeave={handleMouseLeave}
          ref={treeRef}
          className="group cursor-pointer  w-full h-full"
          onClick={shake}
        >
          <Spritesheet
            className="group-hover:img-highlight pointer-events-none transform"
            style={{
              width: `${GRID_WIDTH_PX * 4}px`,
              // Line it up with the click area
              transform: `translate(-${GRID_WIDTH_PX * 2}px,-${
                GRID_WIDTH_PX * 0.5
              }px)`,
              imageRendering: "pixelated",
            }}
            getInstance={(spritesheet) => {
              shakeGif.current = spritesheet;
            }}
            image={shakeSheet}
            widthFrame={448 / 7}
            heightFrame={48}
            fps={24}
            steps={7}
            direction={`forward`}
            autoplay={false}
            loop={true}
            onLoopComplete={(spritesheet) => {
              spritesheet.pause();
            }}
          />
          <InnerPanel
            className={classNames(
              "ml-10 transition-opacity absolute top-6 w-fit left-5 z-40 pointer-events-none",
              {
                "opacity-100": showLabel,
                "opacity-0": !showLabel,
              }
            )}
          >
            <div className="text-xxs text-white mx-1">
              <span>Equip {tool.toLowerCase()}</span>
            </div>
          </InnerPanel>
        </div>
      )}

      <Spritesheet
        style={{
          width: `${GRID_WIDTH_PX * 4}px`,
          // Line it up with the click area
          transform: `translate(-${GRID_WIDTH_PX * 2}px,-${
            GRID_WIDTH_PX * 0.5
          }px)`,
          opacity: collecting ? 1 : 0,
          transition: "opacity 0.2s ease-in",
          imageRendering: "pixelated",
        }}
        className="absolute bottom-0 pointer-events-none"
        getInstance={(spritesheet) => {
          choppedGif.current = spritesheet;
        }}
        image={choppedSheet}
        widthFrame={1040 / 13}
        heightFrame={48}
        fps={20}
        steps={11}
        direction={`forward`}
        autoplay={false}
        loop={true}
        onLoopComplete={(spritesheet) => {
          spritesheet.pause();
        }}
      />

      {chopped && (
        <>
          <img
            src={stump}
            className="absolute"
            style={{
              width: `${GRID_WIDTH_PX}px`,
              bottom: "9px",
              left: "10px",
            }}
            onMouseEnter={handleMouseHoverStump}
            onMouseLeave={handleMouseLeaveStump}
          />
          <div
            className="absolute"
            style={{
              top: "97px",
              left: "12px",
            }}
          >
            <ProgressBar
              percentage={percentage}
              seconds={timeLeft}
              type="progress"
            />
          </div>
          <TimeLeftPanel
            text="Recovers in:"
            timeLeft={timeLeft}
            showTimeLeft={showStumpTimeLeft}
          />
        </>
      )}

      <div
        className={classNames(
          "transition-opacity pointer-events-none absolute top-1 left-3",
          {
            "opacity-100": touchCount > 0,
            "opacity-0": touchCount === 0,
          }
        )}
      >
        <Bar
          percentage={collecting ? 0 : 100 - (touchCount / 3) * 100}
          type="health"
        />
      </div>

      <div
        className={classNames(
          "transition-opacity absolute -bottom-5 w-40 -left-16 z-20 pointer-events-none",
          {
            "opacity-100": showPopover,
            "opacity-0": !showPopover,
          }
        )}
      >
        {popover}
      </div>
    </div>
  );
};
