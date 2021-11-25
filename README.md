# Vue Tour

# Fork from

[Vue Tour](https://github.com/pulsardev/vue-tour)

> Vue Tour is a lightweight, simple and customizable tour plugin for use with Vue.js.
> It provides a quick and easy way to guide your users through your application.

# Added features

1. Custom themes.

```javascript
// ...
data() {
  return {
    tourOptions: {
      theme: '#506eff'
    }
  }
}
// ...
```

2. Only tips mode.Shorten padding and margin event you set some buttons.

```javascript
// ...
data() {
  return {
    tourOptions: {
      onlyTips: true
    }
  }
}
// ...
```

3. Partial style modification.