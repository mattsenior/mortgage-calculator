'use strict';

angular.module('mortgageApp')
  .controller('MainCtrl', ['$scope', '$moment', function ($scope, $moment) {

    // TODO put into factory
    var mortgage = {
      debt:         255845,
      start:        $moment(),
      startISO8601: undefined,
      end:          undefined,
      plans:        [],
      maxMonths:    0
    };

    mortgage.startISO8601 = mortgage.start.format('YYYY-MM');

    mortgage.addPlan = function(plan) {
      mortgage.plans.push(plan);
      mortgage.recalculate();
    };

    mortgage.newPlan = function() {
      var plan = new Plan(mortgage);
      mortgage.addPlan(plan);

      return plan;
    };

    mortgage.removePlan = function(plan) {
      mortgage.plans = mortgage.plans.filter(function(item) {
        return item !== plan;
      });

      // Reset Plan counter if we have no more plans
      if (!mortgage.plans.length) {
        Plan.numInstances = 0;
      }
    };

    mortgage.recalculate = function() {
      var maxMonths = 0;
      angular.forEach(mortgage.plans, function(plan) {
        maxMonths = Math.max(plan.stats.months, maxMonths);
      });

      mortgage.maxMonths = maxMonths;
    };

    // TODO don’t send the mortgage into the plan
    // TODO put into factory
    function Plan(mortgage) {
      Plan.numInstances = (Plan.numInstances || 0) + 1;

      this.mortgage    = mortgage;
      this.i           = Plan.numInstances - 1;
      this.name        = 'Plan ' + (this.i + 1);
      this.months      = [];
      this.monthValues = [];
      this.stats       = {};
      this.totals      = {
        interestCharged: 0,
        totalPayment:    0
      };
      this.getDefaultMonth = function() {
        return {
          standardPayment:    1200,
          additionalPayment:  0,
          interestRate:       4
        };
      };

      // Temporary - for display/editing
      this.currentYear = 1;

      // Init
      this.recalculate();
    }

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
      var months        = [];
      var remainingDebt = this.mortgage.debt;

      if (remainingDebt < 0) {
        throw 'Remaining debt cannot start below 0';
      }

      var i = 0;
      var maxMonths = 1000 * 12;
      var month;
      var previousMonth = this.getDefaultMonth();

      this.totals.interestCharged = 0;
      this.totals.totalPayment    = 0;
      var cumulativeDebtRepayment = 0;

      while (remainingDebt > 0 && i < maxMonths) {

        month      = this.mergeMonths(i, previousMonth);
        month.i    = i;
        month.date = this.mortgage.start.clone().add('months', i);

        // Calculate interest accumulated during this period
        var dailyRate = (month.interestRate / 365.25) / 100;

        // Here we’re using the actual number of days in the month
        //month.interestCharged = dailyRate * month.date.daysInMonth() * remainingDebt;
        //Here we’re using an average of 365.25 / 12 days in the month
        month.interestCharged = dailyRate * (365.25 / 12) * remainingDebt;

        this.totals.interestCharged += month.interestCharged;
        month.cumulativeInterestCharged = this.totals.interestCharged;

        // Add interest to total
        remainingDebt += month.interestCharged;

        // Total payment for month is standard + additional, or the
        // remainingDebt if that’s less
        month.totalPayment           = Math.min(remainingDebt, month.standardPayment + month.additionalPayment);
        this.totals.totalPayment    += month.totalPayment;
        month.cumulativeTotalPayment = this.totals.totalPayment;

        month.debtRepayment           = month.totalPayment - month.interestCharged;
        cumulativeDebtRepayment      += month.debtRepayment;
        month.cumulativeDebtRepayment = cumulativeDebtRepayment;

        // Subtract from total
        remainingDebt      -= month.totalPayment;
        month.remainingDebt = remainingDebt;

        months.push(month);
        previousMonth = month;

        // Keep track of the last month of the mortgage
        this.mortgage.end = month.date;

        i++;
      }

      // TODO shouldn’t this be a filter
      Plan.prototype.monthsForYear = function(year) {
        year = parseInt(year, 10);
        return this.months.filter(function(month) {
          return parseInt(Math.floor((month.i) / 12) + 1, 10) === year;
        });
      };

      this.months = months;

      this.recalculateStats();
    };

    Plan.prototype.recalculateStats = function() {
      var monthCount = this.months.length;

      this.stats = {
        years:  monthCount / 12,
        months: monthCount
      };

      this.stats.wholeYears = Math.ceil(this.stats.years);

      this.stats.yearsMonths = {
        years:  Math.floor(this.stats.years),
        months: monthCount % 12
      };
    };

    Plan.prototype.mergeMonths = function(i, previousMonth) {
      var newMonth = {};
      var plan     = this;
      angular.forEach(['standardPayment', 'additionalPayment', 'interestRate'], function(prop) {
        newMonth[prop] = plan.hasMonthValue(i, prop) ? plan.monthValues[i][prop] : previousMonth[prop];
      });

      return newMonth;
    };

    // Pass mortgage to view
    $scope.mortgage = mortgage;

    // Maintain editing state, for hiding buttons etc
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

    // Helper to auto-select text when editing
    $scope.selectThis = function(evt) {
      if (typeof this.$editable !== 'undefined') {
        var el = this.$editable.inputEl;
        setTimeout(function() {
          el.select();
        }, 0);
        return;
      }

      evt.target.select();
    };

    // Create new plan and set as active tab
    $scope.newPlan = function() {
      var plan = mortgage.newPlan();
      plan.active = true;
      return plan;
    };

    // Remove plan
    $scope.removePlan = function(plan) {
      mortgage.removePlan(plan);
    };

    // Recalculate with new date/total
    $scope.go = function() {
      mortgage.start = $moment(mortgage.startISO8601);

      angular.forEach(mortgage.plans, function(plan) {
        plan.recalculate();
      });
    };

    // Debug setup
    var plan1 = $scope.newPlan();
    plan1.setMonthValue(0, 'interestRate', 2.44);
    plan1.setMonthValue(0, 'standardPayment', 1140.05);
    plan1.setMonthValue(38, 'interestRate', 5.99);
    plan1.setMonthValue(38, 'standardPayment', 1584.98);
  }]);
