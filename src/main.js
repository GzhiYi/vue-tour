import VTour from './components/VTour'
import VStep from './components/VStep'

const YmVueTour = {
  install (Vue, options) {
    Vue.component(VTour.name, VTour)
    Vue.component(VStep.name, VStep)

    // Object containing Tour objects (see VTour.vue) where the tour name is used as key
    Vue.prototype.$tours = {}
  }
}

export default YmVueTour

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(YmVueTour)
}
