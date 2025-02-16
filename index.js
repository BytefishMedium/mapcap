const assert = require('assert')

module.exports = function mapcap (object, cap, lru = false) {
  assert.strictEqual(typeof cap, 'number', 'cap should be a number')
  assert.strictEqual(typeof lru, 'boolean', 'lru should be a boolean')

  let target = object
  if (!(object instanceof Map)) {
    object = class Sub extends object {}
    target = object.prototype
  }

  wrapSet(target, cap)
  if (lru) wrapGet(target)

  return object
}

function wrapSet (target, cap) {
  shimmer(target, 'set', original => {
    return function set (key, value) {
      const res = original.apply(this, arguments)
      if (this.size > cap) {
        this.delete(this.keys().next().value)
      }
      return res
    }
  })
}

function wrapGet (target) {
  shimmer(target, 'get', original => {
    return function get (key) {

      // 读取属性的时候，对这个属性进行修改，从而更新这个属性的使用时间，让它优先不被删除！
      const value = original.apply(this, arguments)
      this.delete(key)
      this.set(key, value)
      return value
    }
  })
}

function shimmer (obj, method, replacer) {
  obj[method] = replacer(obj[method])
}
