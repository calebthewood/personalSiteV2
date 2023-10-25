import { useState, useEffect } from "react";
import TimezoneSelect, {
  allTimezones,
} from "react-timezone-select";
import { v4 as uuidv4 } from "uuid";


// place any desired search terms after #
const usOptimizedTimeZones = {
  ...allTimezones,
  "America/Vancouver": "Pacific Time#PST",
  "America/Los_Angeles": "Los Angeles",
  "America/Detroit": "Eastern Time#EST",
  "America/New_York": "New York",
  "America/Boise": "Mountain Time#MTN",
  "America/Chicago": "Central Time#CST",
};

const TimeZoneField = ({ label = "TimeZone" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [thisTimeZone, setThisTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const uniqueId = uuidv4();

  useEffect(() => {
    if (animating) {
      setTimeout(() => setAnimating(false), 200);
    }
  }, [animating]);

  const toggleMenu = () => {
    if (animating) return;
    setIsOpen(!isOpen);
    setAnimating(true);
  };

  const openMenu = () => {
    if (isOpen && animating) return;
    setIsOpen(true);
    setAnimating(true);
  };

  const closeMenu = () => {
    if (!isOpen && animating) return;
    setIsOpen(false);
    setAnimating(true);
  };

  const formatLabel = (data) => {
    if (typeof data === "string") return <>{data}</>;
    const { value, label, altName } = data;
    const [tzName, abbrev, tzOffset] = parseTzLabel(label);
    return (
      <button
        onClick={() => setThisTimeZone(value)}
        title={altName}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          borderRadius: "20px",
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          color: "white"
        }}
      >
        <div
          style={{
            flex: "1 1 0%",
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >{tzName} {abbrev}
        </div>
        <div
          style={{
            color: "rgb(255 255 255) ",
            opacity: "0.7",
            padding: "auto 0.25rem",
          }}
        >{tzOffset}</div>
      </button>
    );
  };

  return (
    <div style={{
      width: "100%",
      height: "24rem",
      marginTop: "24px",
      background: "#212121",
      padding: "20px",
      borderRadius: "5px",
    }}
    >
      {label && (
        <label htmlFor={uniqueId} className="h5">
          {label}
        </label>
      )}
      <div
        style={{
          overflow: "hidden",
          animationDuration: "200ms",
          transition: "all .2s ease",
          height: isOpen ? "24rem" : "4rem",
        }}
        onClick={toggleMenu}
      >
        <TimezoneSelect
          id={uniqueId}
          name="timezone-select"
          placeholder="Type to search time zones..."
          value={thisTimeZone}
          labelStyle="abbrev"
          displayValue="UTC"
          formatOptionLabel={formatLabel}
          menuShouldScrollIntoView={true}
          timezones={usOptimizedTimeZones}
          menuIsOpen={isOpen}
          onKeyDown={openMenu}
          onFocus={toggleMenu}
          onMenuOpen={openMenu}
          onMenuClose={closeMenu}
          unstyled={true}
          styles={{
            option: (base) => ({
              ...base,
              cursor: "pointer",
              background: "rgba(255, 255, 255)",
              borderRadius: "20px",
              padding: "0.75rem 1rem",
              margin: ".75rem auto",
              boxShadow: "8px 16px 18px 0px rgba(255, 255, 255, 0.3) inset, box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              transitionProperty: "all",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDuration: "150ms",
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              "&:hover": {
                transform: "scale(1.1)",
                background: "linear-gradient(191.85deg, #fcad40 0.3%, #b21be8 49.63%, #371fb7 100%)",
              },
            }),
            control: (base) => ({
              ...base,
              cursor: "pointer",
              color: "white",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              transition: "all .3s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0)",
              color: "white",

            }),
            container: (base) => ({
              ...base,
              width: "100%",
              marginTop: "8px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "20px",

            }),
            valueContainer: (base) => ({
              ...base,
              userSelect: "none",
              fontSize: "0.875rem",
              lineHeight: " 1.25rem",
              color: "white",
            }),
            singleValue: (base) => ({
               ...base,
               userSelect: "none",
               color: "white",
              }),
            input: (base) => ({
              ...base,
              userSelect: "none",
              color: "white",
            }),
            menu: (base) => ({
              ...base,
              borderRadius: "10px",
              marginTop: "0.25rem",
              transitionProperty: "all",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDuration: "150ms",
            }),
            menuList: (base) => ({
              ...base,
              maskImage: "linear-gradient(to top,transparent 0%,black 10%,black 90%,transparent 100%)",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              color: "white",
            }),
          }}
        />
      </div>
    </div>
  );
};

function parseTzLabel(label) {
  const offStart = label.indexOf("(");
  const offEnd = label.indexOf(")");
  const offset = label.slice(offStart + 1, offEnd);

  const abvStart = label.lastIndexOf("(");
  const abvEnd = label.lastIndexOf(")");
  const abbrev = label.slice(abvStart, abvEnd + 1);

  const hasSearchParams = label.includes("#");

  const title = (
    hasSearchParams
      ? label.slice(offEnd + 1, label.indexOf("#"))
      : label.slice(offEnd + 1, abvStart - 1)
  ).trim();

  return [title, abbrev, offset];
}


export default TimeZoneField;