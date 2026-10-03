import Image from "next/image";

type Props = {
  className?: string;
};

export function Uni-CLIMark(props: Props) {
  return (
    <Image
      src="/uni-cli-mark.svg"
      alt=""
      aria-hidden="true"
      className={props.className}
      width={834}
      height={649}
      unoptimized
    />
  );
}
