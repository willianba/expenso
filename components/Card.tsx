type CardProps = {
  height?: string;
};

export default function Card(props: CardProps) {
  const { height } = props;

  return (
    <div class={`card w-full bg-base-100 shadow-s ${height}`}>
      <div class="card-body items-center text-center">
      </div>
    </div>
  );
}
