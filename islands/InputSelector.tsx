import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";

type InputSelectorProps = {
  id: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
  value?: string;
};

const InputSelector = (props: InputSelectorProps) => {
  const { id, name, placeholder, required, options, value } = props;
  const [inputValue, setInputValue] = useState<string>(value ?? "");
  const [selectedOption, setSelectedOption] = useState<string | null>(
    value || null,
  );
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  useEffect(() => {
    if (value) {
      setInputValue(value);
      setSelectedOption(value);
    }
  }, [value]);

  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const { value } = e.target as HTMLInputElement;
    setInputValue(value);
    setSelectedOption(null);
    if (value) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowDropdown(true);
    } else {
      setFilteredOptions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (option: string) => {
    setInputValue(option);
    setSelectedOption(option);
    setShowDropdown(false);
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
        autocomplete="off"
        placeholder={placeholder}
        required={required}
        type="text"
        defaultValue={inputValue}
        onInput={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        class="input input-sm input-bordered"
      />
      {showDropdown && (
        <div class="absolute top-full left-0 right-0 mt-1 w-full shadow-md z-50">
          <ul class="menu menu-sm menu-horizontal bg-base-200 gap-1 rounded-lg w-full">
            {filteredOptions.length > 0
              ? (
                filteredOptions.map((option) => (
                  <li
                    class="w-full"
                    key={option}
                    onMouseDown={() => handleSelect(option)}
                  >
                    <a>{option}</a>
                  </li>
                ))
              )
              : <li class="px-3 py-1">"{inputValue}" will be created</li>}
          </ul>
        </div>
      )}
      <input
        type="hidden"
        name={name}
        value={selectedOption || inputValue}
      />
    </div>
  );
};

export default InputSelector;
