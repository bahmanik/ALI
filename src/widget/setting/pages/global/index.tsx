type GlobalProps = JSX.IntrinsicElements["box"]

const Global = (props: GlobalProps) => {
  return (
    <box
      {...props}
    >
      global
    </box>
  )
}

export default Global
