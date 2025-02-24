<template>
  <div
    v-bind:class="{ 'v-step--sticky': isSticky }"
    class="v-step"
    :id="'v-step-' + hash"
    :ref="'v-step-' + hash"
    :style="{'--theme': theme, padding: onlyTips ? '4px 12px' : '12px 16px'}"
  >
    <slot name="header">
      <div v-if="step.header" class="v-step__header">
        <div v-if="step.header.title" v-html="step.header.title"></div>
      </div>
    </slot>

    <slot name="content">
      <div class="v-step__content" :style="`margin: ${onlyTips ? '4px 0' : '4px 0 8px 0'}`">
        <div v-if="step.content" v-html="step.content"></div>
        <div v-else>
          This is a demo step! The id of this step is {{ hash }} and it targets
          {{ step.target }}.
        </div>
      </div>
    </slot>

    <slot name="actions">
      <div class="v-step__buttons">
        <button
          @click.prevent="skip"
          v-if="!isLast && isButtonEnabled('buttonSkip')"
          class="v-step__button v-step__button-skip"
        >
          {{ labels.buttonSkip }}
        </button>
        <button
          @click.prevent="previousStep"
          v-if="!isFirst && isButtonEnabled('buttonPrevious')"
          class="v-step__button v-step__button-previous"
        >
          {{ labels.buttonPrevious }}
        </button>
        <button
          @click.prevent="nextStep"
          v-if="!isLast && isButtonEnabled('buttonNext')"
          class="v-step__button v-step__button-next"
        >
          {{ labels.buttonNext }}
        </button>
        <button
          @click.prevent="finish"
          v-if="isLast && isButtonEnabled('buttonStop')"
          class="v-step__button v-step__button-stop"
        >
          {{ labels.buttonStop }}
        </button>
      </div>
    </slot>

    <div
      class="v-step__arrow"
      :class="{ 'v-step__arrow--dark': step.header && step.header.title }"
      data-popper-arrow
    ><div class="spin"><div class="in"></div></div></div>
  </div>
</template>

<script>
import { createPopper } from '@popperjs/core'
import jump from 'jump.js'
import sum from 'hash-sum'
import { DEFAULT_STEP_OPTIONS, HIGHLIGHT } from '../shared/constants'

export default {
  name: 'v-step',
  props: {
    step: {
      type: Object
    },
    previousStep: {
      type: Function
    },
    nextStep: {
      type: Function
    },
    stop: {
      type: Function
    },
    skip: {
      type: Function,
      default: function () {
        this.stop()
      }
    },
    finish: {
      type: Function,
      default: function () {
        this.stop()
      }
    },
    isFirst: {
      type: Boolean
    },
    isLast: {
      type: Boolean
    },
    labels: {
      type: Object
    },
    enabledButtons: {
      type: Object
    },
    highlight: {
      type: Boolean
    },
    stopOnFail: {
      type: Boolean
    },
    debug: {
      type: Boolean
    },
    theme: {
      type: String,
      default: '#30BF83'
    },
    onlyTips: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      hash: sum(this.step.target),
      targetElement: document.querySelector(this.step.target)
    }
  },
  computed: {
    params () {
      return {
        ...DEFAULT_STEP_OPTIONS,
        ...{ highlight: this.highlight }, // Use global tour highlight setting first
        ...{ enabledButtons: Object.assign({}, this.enabledButtons) },
        ...this.step.params // Then use local step parameters if defined
      }
    },
    /**
     * A step is considered sticky if it has no target.
     */
    isSticky () {
      return !this.step.target
    },
    cssVars () {
      return {
        '--theme': this.theme
      }
    }
  },
  methods: {
    createStep () {
      if (this.debug) {
        console.log(
          '[Vue Tour] The target element ' +
            this.step.target +
            ' of .v-step[id="' +
            this.hash +
            '"] is:',
          this.targetElement
        )
      }

      if (this.isSticky) {
        document.body.appendChild(this.$refs['v-step-' + this.hash])
      } else {
        if (this.targetElement) {
          this.enableScrolling()
          this.createHighlight()

          createPopper(
            this.targetElement,
            this.$refs['v-step-' + this.hash],
            this.params
          )
        } else {
          if (this.debug) {
            console.error(
              '[Vue Tour] The target element ' +
                this.step.target +
                ' of .v-step[id="' +
                this.hash +
                '"] does not exist!'
            )
          }
          this.$emit('targetNotFound', this.step)
          if (this.stopOnFail) {
            this.stop()
          }
        }
      }
    },
    enableScrolling () {
      if (this.params.enableScrolling) {
        if (this.step.duration || this.step.offset) {
          let jumpOptions = {
            duration: this.step.duration || 1000,
            offset: this.step.offset || 0,
            callback: undefined,
            a11y: false
          }

          jump(this.targetElement, jumpOptions)
        } else {
          // Use the native scroll by default if no scroll options has been defined
          this.targetElement.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    isHighlightEnabled () {
      if (this.debug) {
        console.log(
          `[Vue Tour] Highlight is ${
            this.params.highlight ? 'enabled' : 'disabled'
          } for .v-step[id="${this.hash}"]`
        )
      }
      return this.params.highlight
    },
    createHighlight () {
      if (this.isHighlightEnabled()) {
        document.body.classList.add(HIGHLIGHT.classes.active)
        const transitionValue = window
          .getComputedStyle(this.targetElement)
          .getPropertyValue('transition')

        // Make sure our background doesn't flick on transitions
        if (transitionValue !== 'all 0s ease 0s') {
          this.targetElement.style.transition = `${transitionValue}, ${HIGHLIGHT.transition}`
        }

        this.targetElement.classList.add(HIGHLIGHT.classes.targetHighlighted)
        // The element must have a position, if it doesn't have one, add a relative position class
        if (!this.targetElement.style.position) {
          this.targetElement.classList.add(HIGHLIGHT.classes.targetRelative)
        }
      } else {
        document.body.classList.remove(HIGHLIGHT.classes.active)
      }
    },
    removeHighlight () {
      if (this.isHighlightEnabled()) {
        const target = this.targetElement
        const currentTransition = this.targetElement.style.transition
        this.targetElement.classList.remove(
          HIGHLIGHT.classes.targetHighlighted
        )
        this.targetElement.classList.remove(HIGHLIGHT.classes.targetRelative)
        // Remove our transition when step is finished.
        if (currentTransition.includes(HIGHLIGHT.transition)) {
          setTimeout(() => {
            target.style.transition = currentTransition.replace(
              `, ${HIGHLIGHT.transition}`,
              ''
            )
          }, 0)
        }
      }
    },
    isButtonEnabled (name) {
      return this.params.enabledButtons.hasOwnProperty(name)
        ? this.params.enabledButtons[name]
        : true
    }
  },
  mounted () {
    this.createStep()
  },
  destroyed () {
    this.removeHighlight()
  }
}
</script>

<style lang="scss" scoped>
.v-step {
  background: var(--theme);
  color: white;
  max-width: 320px;
  border-radius: 4px;
  box-shadow: 0px 4px 8px rgba(33, 35, 41, 0.08);
  pointer-events: auto;
  text-align: center;
  z-index: 10000;

  &--sticky {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    & .v-step__arrow {
      display: none;
    }
  }
}

.v-step__arrow,
.v-step__arrow::before {
  position: absolute;
  width: 10px;
  height: 10px;
  background: inherit;
}

.v-step__arrow {
  position: relative;
  visibility: hidden;

  &--dark {
    &:before {
      background: var(--theme);
    }
  }
}
.spin {
    visibility: visible;
    width: 16px;
    height: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 9999px;
    position: relative;
    animation: spining 1s infinite;
    .in {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background-color: var(--theme);
    }
}
@keyframes spining {
  from {
    width: 8px;
    height: 8px;
    margin-left: 4px;
    margin-top: 4px;
    background-color: var(--theme);
  }
  to {
    width: 24px;
    height: 24px;
    margin-left: -4px;
    margin-top: -4px;
    background-color: rgba(136, 204, 0, 0);
  }
}

.v-step__arrow::before {
  visibility: visible;
  content: "";
  transform: rotate(45deg);
  margin-left: -5px;
}

.v-step[data-popper-placement^="top"] > .v-step__arrow {
  bottom: -5px;
  .spin {
    bottom: -20px;
    left: -3px;
  }
}

.v-step[data-popper-placement^="bottom"] > .v-step__arrow {
  top: -5px;
  .spin {
    top: -20px;
    left: -3px;
  }
}

.v-step[data-popper-placement^="right"] > .v-step__arrow {
  left: -5px;
  .spin {
    left: -20px;
    top: -3px;
  }
}

.v-step[data-popper-placement^="left"] > .v-step__arrow {
  right: -5px;
  .spin {
    right: -20px;
    top: -3px;
  }
}

/* Custom */

.v-step__header {
  background-color: var(--theme);
  text-align: left;
  font-size: 16px;
  font-weight: 600;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.v-step__content {
  font-size: 14px;
  text-align: left;
}
.v-step__buttons {
  text-align: right;
}
.v-step__button {
  background: #fff;
  border-radius: 4px;
  color: var(--theme);
  cursor: pointer;
  display: inline-block;
  font-size: 12px;
  height: 28px;
  line-height: 20px;
  outline: none;
  text-align: right;
  text-decoration: none;
  transition: all 0.2s ease;
  vertical-align: middle;
  white-space: nowrap;
  border: none;
  padding: 0 14px;

  &:hover {
    background-color: rgba(white, 0.9);
    color: var(--theme);
  }
  &:not(:last-child) {
    margin-right: 8px;
  }
}
</style>
