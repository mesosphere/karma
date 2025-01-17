import React, {
  FC,
  Ref,
  CSSProperties,
  useRef,
  useState,
  useCallback,
} from "react";

import { observer } from "mobx-react-lite";

import { Manager, Reference, Popper } from "react-popper";

import AsyncSelect from "react-select/async";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons/faCaretDown";

import { AlertStore } from "Stores/AlertStore";
import { Settings } from "Stores/Settings";
import { CommonPopperModifiers } from "Common/Popper";
import { NewLabelName, StringToOption, OptionT } from "Common/Select";
import { DropdownSlide } from "Components/Animations/DropdownSlide";
import { ThemeContext } from "Components/Theme";
import { useOnClickOutside } from "Hooks/useOnClickOutside";

const NullContainer: FC = () => null;

const GridLabelNameSelect: FC<{
  alertStore: AlertStore;
  settingsStore: Settings;
}> = ({ alertStore, settingsStore }) => {
  const loadOptions = (
    inputValue: string,
    callback: (options: OptionT[]) => void
  ) => {
    const labelNames: { [key: string]: boolean } = {
      "@alertmanager": true,
      "@cluster": true,
      "@receiver": true,
    };

    alertStore.data.grids.forEach((grid) => {
      labelNames[grid.labelName] = true;
      grid.alertGroups.forEach((group) => {
        Object.keys(group.labels).forEach((name) => {
          labelNames[name] = true;
        });
        Object.keys(group.shared.labels).forEach((name) => {
          labelNames[name] = true;
        });
        group.alerts.forEach((alert) => {
          Object.keys(alert.labels).forEach((name) => {
            labelNames[name] = true;
          });
        });
      });
    });

    callback(
      Object.keys(labelNames)
        .sort()
        .map((key) => StringToOption(key))
    );
  };

  const context = React.useContext(ThemeContext);

  return (
    <AsyncSelect
      styles={context.reactSelectStyles}
      classNamePrefix="react-select"
      formatCreateLabel={NewLabelName}
      loadOptions={loadOptions}
      defaultOptions
      onChange={(option) => {
        settingsStore.multiGridConfig.config.gridLabel = (option as OptionT).value;
      }}
      menuIsOpen={true}
      components={{
        ClearIndicator: null,
        IndicatorSeparator: null,
        DropdownIndicator: null,
        ValueContainer: NullContainer,
        Control: NullContainer,
      }}
    />
  );
};

const Dropdown: FC<{
  popperPlacement?: string;
  popperRef?: Ref<HTMLDivElement>;
  popperStyle?: CSSProperties;
  alertStore: AlertStore;
  settingsStore: Settings;
}> = ({
  popperPlacement,
  popperRef,
  popperStyle,
  alertStore,
  settingsStore,
}) => {
  return (
    <div
      className="dropdown-menu d-block shadow components-grid-label-select-menu border-0 p-0"
      ref={popperRef}
      style={{
        fontSize: "1rem",
        fontWeight: "normal",
        ...popperStyle,
      }}
      data-placement={popperPlacement}
    >
      <GridLabelNameSelect
        alertStore={alertStore}
        settingsStore={settingsStore}
      />
    </div>
  );
};

const GridLabelSelect: FC<{
  alertStore: AlertStore;
  settingsStore: Settings;
}> = observer(({ alertStore, settingsStore }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(!isVisible), [isVisible]);

  const ref = useRef<HTMLDivElement | null>(null);
  useOnClickOutside(ref, hide, isVisible);

  return (
    <div ref={ref} className="components-label badge pl-1 pr-2">
      <Manager>
        <Reference>
          {({ ref }) => (
            <span
              ref={ref}
              onClick={toggle}
              className="border-0 rounded-0 bg-inherit cursor-pointer px-1 py-0 components-grid-label-select-dropdown"
              data-toggle="dropdown"
            >
              <FontAwesomeIcon className="text-muted" icon={faCaretDown} />
            </span>
          )}
        </Reference>
        <DropdownSlide in={isVisible} unmountOnExit>
          <Popper modifiers={CommonPopperModifiers}>
            {({ placement, ref, style }) => (
              <Dropdown
                popperPlacement={placement}
                popperRef={ref}
                popperStyle={style}
                alertStore={alertStore}
                settingsStore={settingsStore}
              />
            )}
          </Popper>
        </DropdownSlide>
      </Manager>
    </div>
  );
});

export { GridLabelSelect };
