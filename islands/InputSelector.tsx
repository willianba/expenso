import { useEffect, useState } from "preact/hooks";
import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { JSX } from "preact/jsx-runtime";

type InputSelectorProps = {
  id: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
  value?: string;
  formSubmitted: Signal<boolean>;
};

const InputSelector = (props: InputSelectorProps) => {
  const { id, name, placeholder, required, options, value, formSubmitted } =
    props;
  const [inputValue, setInputValue] = useState<string>(value ?? "");
  const [selectedOption, setSelectedOption] = useState<string | null>(
    value || null,
  );
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const showDropdown = useSignal(false);

  useEffect(() => {
    if (value) {
      setInputValue(value);
      setSelectedOption(value);
    }
  }, [value]);

  useSignalEffect(() => {
    if (formSubmitted.value) {
      setInputValue("");
      setSelectedOption(null);
      showDropdown.value = false;
    }
  });

  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const { value } = e.target as HTMLInputElement;
    setInputValue(value);
    setSelectedOption(null);
    if (value) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      showDropdown.value = true;
    } else {
      setFilteredOptions([]);
      showDropdown.value = false;
    }
  };

  const handleSelect = (option: string) => {
    setInputValue(option);
    setSelectedOption(option);
    showDropdown.value = false;
  };

  const handleBlur = () => {
    if (!selectedOption) {
      const filtered = options.find((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      );
      if (filtered) {
        handleSelect(filtered);
      }
    }
    showDropdown.value = false;
  };

  const handleFocus = () => {
    setInputValue("");
    setSelectedOption(null);
    setFilteredOptions(options);
    showDropdown.value = true;
  };

  const shouldShowDropdown = () => {
    if (showDropdown.value) {
      return filteredOptions.length > 0 || inputValue;
    }
    return false;
  };

  const renderListItems = () => {
    if (filteredOptions.length > 0) {
      return filteredOptions.map((option) => (
        <li
          class="w-full"
          key={option}
          onMouseDown={() => handleSelect(option)}
        >
          <a>{option}</a>
        </li>
      ));
    }

    if (inputValue) {
      return <li class="px-3 py-1">"{inputValue}" will be created</li>;
    }
  };

  return (
    <fieldset class="relative fieldset">
      <input
        id={id}
        autocomplete="off"
        placeholder={placeholder}
        required={required}
        type="text"
        value={inputValue}
        defaultValue={inputValue}
        onInput={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        class="input input-sm w-full"
      />
      {shouldShowDropdown() && (
        <div class="absolute top-full left-0 right-0 mt-1 w-full shadow-md rounded-lg z-50">
          <ul class="menu menu-sm menu-horizontal bg-base-200 gap-1 rounded-lg w-full">
            {renderListItems()}
          </ul>
        </div>
      )}
      <input
        type="hidden"
        name={name}
        value={selectedOption || inputValue}
      />
    </fieldset>
  );
};

export default InputSelector;
