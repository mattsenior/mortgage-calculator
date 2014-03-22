'use strict';

angular.module('mortgageApp')
  .controller('MainCtrl', ['$scope', function ($scope) {
    var mortgage = {
      debt:  250000,
      plans: []
    };

    function Plan(debt) {
      this.debt        = debt;
      this.months      = [];
      this.monthValues = [];
      this.stats       = {};
      this.getDefaultMonth = function() {
        return {
          standardPayment:    1000,
          additionalPayment:  0
        };
      };
      this.recalculate();
    }

    Plan.prototype.setDebt = function(debt) {
      this.debt = debt;
      this.recalculate();
    };

    Plan.prototype.setMonthValue = function(i, prop, value) {
      this.monthValues[i] = this.monthValues[i] || {};
      this.monthValues[i][prop] = Number(value);
      this.recalculate();
    };

    Plan.prototype.removeMonthValue = function(i, prop) {
      if (!this.hasMonthValue(i, prop)) {
        return;
      }

      delete this.monthValues[i][prop];
      this.recalculate();
    };

    Plan.prototype.hasMonthValue = function(i, prop) {
      if (typeof this.monthValues[i] === 'undefined') {
        return false;
      }

      if (typeof this.monthValues[i][prop] === 'undefined') {
        return false;
      }

      return true;
    };

    Plan.prototype.recalculate = function() {
      var months          = [];
      var remainingDebt = this.debt;

      if (remainingDebt < 0) {
        throw 'Remaining debt cannot start below 0';
      }

      var i = 0;
      var maxMonths = 200 * 12;
      var month;
      var previousMonth = this.getDefaultMonth();

      while (remainingDebt > 0 && i < maxMonths) {

        month = this.mergeMonths(i, previousMonth);

        month.totalPayment  = month.standardPayment + month.additionalPayment;

        remainingDebt -= month.totalPayment;

        month.remainingDebt = remainingDebt;
        month.i             = i;

        months.push(month);
        previousMonth = month;

        i++;
      }

      this.months = months;

      this.recalculateStats();
    };

    Plan.prototype.recalculateStats = function() {
      var monthCount = this.months.length;

      this.stats = {
        years:  monthCount / 12,
        months: monthCount
      };

      this.stats.yearsMonths = {
        years:  Math.floor(this.stats.years),
        months: monthCount % 12
      };
    };

    Plan.prototype.mergeMonths = function(i, previousMonth) {
      var newMonth = {};
      var plan     = this;
      angular.forEach(['standardPayment', 'additionalPayment'], function(prop) {
        newMonth[prop] = plan.hasMonthValue(i, prop) ? plan.monthValues[i][prop] : previousMonth[prop];
      });

      return newMonth;
    };

    var plan1 = new Plan(mortgage.debt);

    //plan1.setMonthValue(0, 'standardPayment', 5000);
    //plan1.setMonthValue(2, 'additionalPayment', 1000);

    //plan1.setMonth(0, {
    //  standardPayment:   1000,
    //  additionalPayment: 0
    //});

    mortgage.plans.push(plan1);

    $scope.mortgage = mortgage;

    var editing = [];
    $scope.editing = function(i, prop, bool) {
      if (typeof bool === 'undefined') {
        if (typeof editing[i] === 'undefined' || typeof editing[i][prop] === 'undefined') {
          return false;
        }

        return editing[i][prop];
      }

      editing[i] = editing[i] || {};
      editing[i][prop] = bool;
    };

    $scope.selectThis = function() {
      var el = this.$editable.inputEl;
      setTimeout(function() {
        el.select();
      }, 0);
    };

    $scope.go = function() {
      mortgage.plans[0].setDebt(mortgage.debt);
    };
  }]);
