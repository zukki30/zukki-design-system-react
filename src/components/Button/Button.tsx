// import "./button.css";

// export type ButtonProps = {};

type Props = {
  onClick: () => void;
};

/** Primary UI component for user interaction */
export const Button = ({ onClick }: Props) => {
  return (
    <button type="button" onClick={onClick}>
      test
    </button>
  );
};
