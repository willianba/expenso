import { useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";

type Option = {
  id?: string;
  label: string;
};

type InputSelectorProps = {
  id: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: Option[];
};

const InputSelector = (props: InputSelectorProps) => {
  const { id, name, placeholder, required, options } = props;
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const { value } = e.target as HTMLInputElement;
    setInputValue(value);
    setSelectedOption(null);
    if (value) {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowDropdown(true);
    } else {
      setFilteredOptions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (option: Option) => {
    setInputValue(option.label);
    setSelectedOption(option);
    setShowDropdown(false);
  };

  const handleBlur = () => {
    if (!selectedOption) {
      const filtered = options.find((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      );
      if (filtered) {
        handleSelect(filtered);
      }
    }
    setTimeout(() => {
      setShowDropdown(false);
    }, 100);
  };

  const handleFocus = () => {
    setInputValue("");
    setSelectedOption(null);
    setFilteredOptions(options);
    setShowDropdown(true);
  };

  return (
    <div class="relative form-control">
      <input
        id={id}
        placeholder={placeholder}
        required={required}
        type="text"
        value={inputValue}
        onInput={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        class="input input-sm input-bordered"
      />
      {showDropdown && (
        <ul class="absolute top-full left-0 right-0 border border-base-300 mt-1 rounded-lg shadow-lg z-50 bg-base-100">
          {filteredOptions.length > 0
            ? (
              filteredOptions.map((option) => (
                <li
                  key={option.id || option.label}
                  onMouseDown={() => handleSelect(option)}
                  class="px-4 py-2 hover:bg-base-200 cursor-pointer"
                >
                  {option.label}
                </li>
              ))
            )
            : <li class="px-4 py-2">No results</li>}
        </ul>
      )}
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(selectedOption || { label: inputValue })}
      />
    </div>
  );
};

export default InputSelector;
