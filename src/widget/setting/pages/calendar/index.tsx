import { Accessor } from "gnim"
import { Gtk } from "ags/gtk4"
import { Header } from "../../_component/header"
import { Option } from "../../_component/option"
import options from "src/configuration"

type CalendarProps = JSX.IntrinsicElements["box"]

const Calendar = (props: CalendarProps) => {
  const { calendar } = options
  const { window, style, header, grid } = calendar
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      {...props}
    >
      <Header title="calendar" />
      { /* <Option title="" opt={calendar.calendar} enums={CalendarEnum} /> */}
      <Option title="locals" opt={calendar.locale} />
      { /* <Option title="" opt={calendar.startOfWeek} enums={WeekDaysEnum} /> */}
      { /* <Option title="" opt={calendar.weekend} array /> */}
      <Option title="show outside Days" opt={calendar.showOutsideDays} />
      <Option title="show week numbers" opt={calendar.showWeekNumbers} />
      <Option title="show secondary date" opt={calendar.showSecondaryDate} />
      { /* <Option title="" opt={calendar.secondaryCalendar} enums={CalendarEnum} /> */}

      <Header title="window" />
      <Option title="width" opt={window.width} />
      <Option title="height" opt={window.height} />
      <Option title="margin" opt={window.margin} />
      <Option title="layout" opt={window.layout} />
      { /* <Option title="" opt={window.revealTransition} enums={AnchorLayoutEnum} /> */}
      { /* <Option title="" opt={window.revealTransition} enums={RevealTransitionWithAutoEnum} /> */}
      <Option title="transition duration" opt={window.transitionDuration} />

      <Header title="style" />
      <Option title="background" opt={style.bg} type="color" />
      <Option title="background opacity" opt={style.bgOpacity} />
      <Option title="radius" opt={style.radius} />
      <Option title="padding" opt={style.padding} />
      { /* <Option title="" opt={style.borderLocation} enums={BorderLocationEnum}/> */}
      <Option title="border width" opt={style.borderWidth} />
      <Option title="border color" opt={style.borderColor} type="color" />
      <Option title="shadow Enable" opt={style.shadowEnable} />
      <Option title="shadowX" opt={style.shadowX} />
      <Option title="shadowY" opt={style.shadowY} />
      <Option title="shadow blur" opt={style.shadowBlur} />
      <Option title="shadow spread" opt={style.shadowSpread} />
      <Option title="shadow color" opt={style.shadowColor} type="color" />

      <Header title="header" />
      <Option title="show" opt={header.show} />
      <Option title="navigation Button Size" opt={header.navButtonSize} />
      <Option title="navigation Button Radius" opt={header.navButtonRadius} />

      <Header title="grid" />
      <Option title="weekday opacity" opt={grid.weekdayOpacity} />
      <Option title="cell radius" opt={grid.cellRadius} />
      <Option title="cell padding" opt={grid.cellPadding} />
      <Option title="cell gap" opt={grid.cellGap} />
      <Option title="outside opacity" opt={grid.outsideOpacity} />
      <Option title="weekend opacity" opt={grid.weekendOpacity} />
      <Option title="today background" opt={grid.todayBg} type="color" />
      <Option title="selected background" opt={grid.selectedBg} type="color" />
      <Option title="hover background" opt={grid.hoverBg} type="color" />
    </box>
  )
}

export default Calendar
