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
      this.monthValues[i][prop] = value;
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
      var month;
      var previousMonth = this.getDefaultMonth();

      while (remainingDebt > 0) {

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

    Plan.prototype.cloneMonth = function(month) {
      var newMonth = {};

      newMonth.standardPayment   = month.standardPayment;
      newMonth.additionalPayment = month.additionalPayment;

      return newMonth;
    };

    var plan1 = new Plan(mortgage.debt);

    //plan1.setMonth(0, {
    //  standardPayment:   1000,
    //  additionalPayment: 0
    //});

    mortgage.plans.push(plan1);

    $scope.mortgage = mortgage;

    $scope.go = function() {
      mortgage.plans[0].setDebt(mortgage.debt);
    };
  }]);
