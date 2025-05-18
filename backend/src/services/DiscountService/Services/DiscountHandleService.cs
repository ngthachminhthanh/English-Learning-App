using System.Text.Json;
using DiscountService.Data;
using DiscountService.Events;
using DiscountService.Interfaces;
using DiscountModel = DiscountService.Models.Discount;

namespace DiscountService.Services
{
    public class DiscountHandleService : IDiscountService
    {
        private readonly DiscountDbContext _context;

        // Constructor definition (using dependency injection)
        public DiscountHandleService(DiscountDbContext context)
        {
            _context = context;
        }

        public async Task CreateOrUpdateDiscountAsync(DiscountEvent discountEvent)
        {
            var discount = await _context.Discounts.FindAsync(discountEvent.Id);

            if (discount == null)
            {
                discount = new DiscountModel
                {
                    Id = discountEvent.Id,
                    FlatAmount = discountEvent.FlatAmount,
                    StartDate = discountEvent.StartDate,
                    Code = discountEvent.Code,
                    EndDate = discountEvent.EndDate,
                    Type = discountEvent.Type,
                    OwnerId = discountEvent.OwnerId,
                    UsageLimit = discountEvent.UsageLimit,
                    IsActive = discountEvent.IsActive,
                    UsageCount = discountEvent.UsageCount,
                    CourseIds = JsonSerializer.Serialize(discountEvent.CourseIds),
                    Percentage = discountEvent.Percentage
                };

                await _context.Discounts.AddAsync(discount);
            }
            else
            {
                discount.CourseIds = JsonSerializer.Serialize(discountEvent.CourseIds);
                discount.Percentage = discountEvent.Percentage;
                discount.FlatAmount = discountEvent.FlatAmount;
                discount.StartDate = discountEvent.StartDate;
                discount.Code = discountEvent.Code;
                discount.EndDate = discountEvent.EndDate;
                discount.Type = discountEvent.Type;
                discount.OwnerId = discountEvent.OwnerId;
                discount.UsageLimit = discountEvent.UsageLimit;
                discount.IsActive = discountEvent.IsActive;
                discount.UsageCount = discountEvent.UsageCount;
            }

            await _context.SaveChangesAsync();
        }
    }
}
