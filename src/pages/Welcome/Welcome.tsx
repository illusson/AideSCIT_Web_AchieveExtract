import './Welcome.css';

import {ReactComponentCompact} from "../../application/core/ReactComponentCompact";
import ic_launcher from "../../res/mipmap/ic_launcher.png"
import {DayCallback, DayHelper} from "../../application/helper/DayHelper";
import {CurlToolException} from "../../application/util/CurlUnit";
import {withRouter} from 'react-router-dom'

class Welcome extends ReactComponentCompact {
    componentDidMount() {
        setTimeout(this.getDayInfo.bind(this), 500)
    }

    getDayInfo(){
        const this_componentDidMount = this
        new DayHelper().get(new class implements DayCallback {
            onFailure(code: number, message?: string, e?: CurlToolException) {

            }

            onResult(semester: number, school_year: string) {
                const sp = this_componentDidMount.getSharedPreference("user")
                sp.edit()
                    .putString("school_year", school_year)
                    .putNumber("semester", semester)
                    .apply()
                const is_login = sp.getBoolean("is_login", false)
                const access_expired = sp.getNumber("access_expired", 0) < new Date().getMilliseconds()
                const refresh_expired = sp.getNumber("refresh_expired", 0) < new Date().getMilliseconds()
                ReactComponentCompact.setup = true
                switch (true) {
                    case !is_login:
                    case refresh_expired:
                        this_componentDidMount.props.history.replace("/login")
                        break
                    case access_expired:
                        break
                    default:
                        this_componentDidMount.props.history.replace("/extract")
                }
            }
        }())
    }

    render() {
        return (
            <div>
                <img id={"welcome-logo"} src={ic_launcher} alt={"logo"}/>
            </div>
        )
    }
}

export default withRouter(Welcome)