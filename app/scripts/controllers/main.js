'use strict';

angular.module('mortgageApp')
  .controller('MainCtrl', ['$scope', function ($scope) {
    var mortgage = {
      debt:  200000,
      plans: []
    };

    function Plan(debt) {
      this.debt   = debt;
      this.months = [];
      this.stats  = {}
      this.getDefaultMonth = function() {
        return {
          standardPayment:    1000,
          additionalPayment:  0
        };
      }
      this.recalculate();
    }

    Plan.prototype.setDebt = function(debt) {
      this.debt = debt;
      this.recalculate();
    };

    Plan.prototype.setMonth = function(i, month) {

      month.explicit = true;

      this.months[i] = month;
      this.recalculate();
    };

    Plan.prototype.hasMonth = function(i) {
      if (typeof this.months[i] === 'undefined') {
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

        if (this.hasMonth(i)) {
          month = this.months[i];
        } else {
          month = this.cloneMonth(previousMonth);
        }

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
